-- Migration: 031_create_invoice_tables.sql
-- Description: Create invoice management tables with support for partial payments

BEGIN;

-- Create updated_at function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create shop_settings table
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Payment timing preference
    payment_required_before_service BOOLEAN DEFAULT true,
    
    -- Invoice configuration
    invoice_prefix TEXT DEFAULT 'INV' CHECK (invoice_prefix ~ '^[A-Z0-9-]{1,10}$'),
    last_invoice_number INTEGER DEFAULT 999 CHECK (last_invoice_number >= 0),
    
    -- Payment method availability
    stripe_enabled BOOLEAN DEFAULT true,
    cash_enabled BOOLEAN DEFAULT false,
    external_pos_enabled BOOLEAN DEFAULT false,
    
    -- Additional settings as JSON
    payment_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_shop_settings UNIQUE (shop_id)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    
    -- Invoice details
    invoice_number TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    deposit_amount_cents INTEGER DEFAULT 0 CHECK (deposit_amount_cents >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'cancelled')),
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Structured data
    line_items JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_invoice_number_per_shop UNIQUE (shop_id, invoice_number),
    CONSTRAINT unique_order_invoice UNIQUE (order_id),
    CONSTRAINT valid_line_items CHECK (jsonb_typeof(line_items) = 'array'),
    CONSTRAINT valid_deposit_amount CHECK (deposit_amount_cents <= amount_cents)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_type TEXT NOT NULL DEFAULT 'full' CHECK (payment_type IN ('deposit', 'remainder', 'full')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cash', 'external_pos')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- External references
    stripe_payment_intent_id TEXT UNIQUE,
    external_reference TEXT,
    notes TEXT,
    
    -- Metadata
    stripe_metadata JSONB,
    
    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT stripe_id_required_for_stripe CHECK (
        (payment_method = 'stripe' AND stripe_payment_intent_id IS NOT NULL) OR
        (payment_method != 'stripe')
    )
);

-- Create payment_links table
CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Link details
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    stripe_payment_link_id TEXT,
    stripe_checkout_session_id TEXT,
    url TEXT NOT NULL,
    
    -- Status tracking
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create invoice_status_history table
CREATE TABLE IF NOT EXISTS invoice_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Status change details
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL, -- user_id or 'system'
    reason TEXT,
    
    -- Additional context
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invoice_invoice_email_templates table (renamed to avoid conflict with existing invoice_email_templates)
CREATE TABLE IF NOT EXISTS invoice_invoice_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Template details
    template_type TEXT NOT NULL CHECK (template_type IN ('order_created', 'payment_request', 'invoice_receipt', 'deposit_receipt')),
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    
    -- Template metadata
    variables_used JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_invoice_template_type_per_shop UNIQUE (shop_id, template_type)
);

-- Create stripe_webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX idx_invoices_status ON invoices(status) WHERE status IN ('pending', 'partially_paid');
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_shop_status ON invoices(shop_id, status);
CREATE INDEX idx_invoices_shop_created ON invoices(shop_id, created_at DESC);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_invoice_status ON payments(invoice_id, status);
CREATE INDEX idx_payments_method_status ON payments(payment_method, status) WHERE status = 'completed';

CREATE INDEX idx_payment_links_token ON payment_links(token);
CREATE INDEX idx_payment_links_invoice_id ON payment_links(invoice_id);
CREATE INDEX idx_payment_links_status ON payment_links(status) WHERE status = 'active';
CREATE INDEX idx_payment_links_expires_at ON payment_links(expires_at) WHERE status = 'active';

CREATE INDEX idx_invoice_status_history_invoice_id ON invoice_status_history(invoice_id);
CREATE INDEX idx_invoice_status_history_created_at ON invoice_status_history(created_at DESC);

CREATE INDEX idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

-- Create triggers
CREATE TRIGGER update_shop_settings_updated_at
    BEFORE UPDATE ON shop_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_email_templates_updated_at
    BEFORE UPDATE ON invoice_email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create functions for atomic operations

-- Function to create invoice with atomic number generation
CREATE OR REPLACE FUNCTION create_invoice_with_number(
  p_shop_id UUID,
  p_order_id UUID,
  p_client_id UUID,
  p_amount_cents INTEGER,
  p_deposit_amount_cents INTEGER DEFAULT 0,
  p_line_items JSONB DEFAULT '[]',
  p_description TEXT DEFAULT NULL
) RETURNS invoices AS $$
DECLARE
  v_invoice invoices;
  v_settings shop_settings;
  v_invoice_number TEXT;
BEGIN
  -- Lock settings row to prevent concurrent number generation
  SELECT * INTO v_settings
  FROM shop_settings
  WHERE shop_id = p_shop_id
  FOR UPDATE;

  -- If no settings exist, create with defaults
  IF v_settings IS NULL THEN
    INSERT INTO shop_settings (shop_id)
    VALUES (p_shop_id)
    RETURNING * INTO v_settings;
  END IF;

  -- Generate next invoice number
  v_invoice_number := v_settings.invoice_prefix || '-' ||
    LPAD((v_settings.last_invoice_number + 1)::TEXT, 6, '0');

  -- Update last invoice number
  UPDATE shop_settings
  SET last_invoice_number = last_invoice_number + 1
  WHERE shop_id = p_shop_id;

  -- Create invoice
  INSERT INTO invoices (
    shop_id, order_id, client_id, invoice_number,
    amount_cents, deposit_amount_cents, line_items, description, status
  ) VALUES (
    p_shop_id, p_order_id, p_client_id, v_invoice_number,
    p_amount_cents, p_deposit_amount_cents, p_line_items, p_description, 'pending'
  ) RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql;

-- Function to process manual payment
CREATE OR REPLACE FUNCTION process_manual_payment(
  p_invoice_id UUID,
  p_payment_type TEXT,
  p_payment_method TEXT,
  p_amount_cents INTEGER,
  p_external_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_invoice invoices;
  v_total_paid INTEGER;
  v_new_status TEXT;
BEGIN
  -- Get invoice for update
  SELECT * INTO v_invoice
  FROM invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  -- Insert payment record
  INSERT INTO payments (
    invoice_id, payment_type, payment_method, amount_cents,
    status, external_reference, notes, processed_at
  ) VALUES (
    p_invoice_id, p_payment_type, p_payment_method, p_amount_cents,
    'completed', p_external_reference, p_notes, now()
  );

  -- Calculate total paid
  SELECT SUM(amount_cents) INTO v_total_paid
  FROM payments
  WHERE invoice_id = p_invoice_id
  AND status = 'completed';

  -- Determine new invoice status
  IF v_total_paid >= v_invoice.amount_cents THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update invoice status if changed
  IF v_new_status != v_invoice.status THEN
    UPDATE invoices
    SET status = v_new_status, updated_at = now()
    WHERE id = p_invoice_id;

    -- Log status change
    INSERT INTO invoice_status_history (
      invoice_id, previous_status, new_status,
      changed_by, reason
    ) VALUES (
      p_invoice_id, v_invoice.status, v_new_status,
      COALESCE(p_user_id, 'system'), 'Payment recorded'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check single unpaid invoice per order
CREATE OR REPLACE FUNCTION check_single_unpaid_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM invoices
    WHERE order_id = NEW.order_id
    AND status IN ('pending', 'partially_paid')
    AND id != COALESCE(NEW.id, gen_random_uuid())
  ) THEN
    RAISE EXCEPTION 'Order already has an unpaid invoice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_unpaid_invoice
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_single_unpaid_invoice();

-- Function to prevent invoice modification after full payment
CREATE OR REPLACE FUNCTION prevent_paid_invoice_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'paid' AND (
    NEW.amount_cents != OLD.amount_cents OR
    NEW.deposit_amount_cents != OLD.deposit_amount_cents
  ) THEN
    RAISE EXCEPTION 'Cannot modify amounts of paid invoice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_paid_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_paid_invoice_changes();

-- Insert default email templates for all shops
INSERT INTO invoice_email_templates (shop_id, template_type, subject, body_html, body_text, variables_used)
SELECT
  s.id,
  template.type,
  template.subject,
  template.body_html,
  template.body_text,
  template.variables
FROM shops s
CROSS JOIN (
  VALUES
  ('order_created',
   'Order Confirmation - {{order_number}}',
   '<h2>Order Confirmed</h2><p>Hi {{client_name}},</p><p>Your order {{order_number}} has been received.</p><p>Total: {{order_total}}</p><p>Expected completion: {{expected_completion}}</p>{{#if deposit_required}}<p><strong>A deposit of {{deposit_amount}} is required to begin work.</strong></p>{{/if}}',
   'Order Confirmed\n\nHi {{client_name}},\n\nYour order {{order_number}} has been received.\n\nTotal: {{order_total}}\nExpected completion: {{expected_completion}}\n{{#if deposit_required}}A deposit of {{deposit_amount}} is required to begin work.{{/if}}',
   '["order_number", "client_name", "order_total", "expected_completion", "deposit_required", "deposit_amount"]'::jsonb),
  ('payment_request',
   'Payment Request - Invoice {{invoice_number}}',
   '<h2>Payment Request</h2><p>Hi {{client_name}},</p><p>Your invoice {{invoice_number}} is ready for payment.</p><p>Amount due: {{amount}}</p><p>Due date: {{due_date}}</p><p><a href="{{payment_link}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pay Now</a></p>',
   'Payment Request\n\nHi {{client_name}},\n\nYour invoice {{invoice_number}} is ready for payment.\n\nAmount due: {{amount}}\nDue date: {{due_date}}\n\nPay now: {{payment_link}}',
   '["invoice_number", "client_name", "amount", "due_date", "payment_link"]'::jsonb),
  ('invoice_receipt',
   'Payment Receipt - Invoice {{invoice_number}}',
   '<h2>Payment Received</h2><p>Hi {{client_name}},</p><p>Thank you for your payment!</p><p>Invoice: {{invoice_number}}</p><p>Amount paid: {{amount}}</p><p>Payment date: {{payment_date}}</p><p>Payment method: {{payment_method}}</p>{{#if remaining_balance}}<p>Remaining balance: {{remaining_balance}}</p>{{/if}}',
   'Payment Received\n\nHi {{client_name}},\n\nThank you for your payment!\n\nInvoice: {{invoice_number}}\nAmount paid: {{amount}}\nPayment date: {{payment_date}}\nPayment method: {{payment_method}}\n{{#if remaining_balance}}Remaining balance: {{remaining_balance}}{{/if}}',
   '["invoice_number", "client_name", "amount", "payment_date", "payment_method", "remaining_balance"]'::jsonb),
  ('deposit_receipt',
   'Deposit Receipt - Invoice {{invoice_number}}',
   '<h2>Deposit Received</h2><p>Hi {{client_name}},</p><p>Thank you for your deposit!</p><p>Invoice: {{invoice_number}}</p><p>Deposit amount: {{deposit_amount}}</p><p>Total invoice: {{total_amount}}</p><p>Remaining balance: {{remaining_balance}}</p><p>Payment date: {{payment_date}}</p>',
   'Deposit Received\n\nHi {{client_name}},\n\nThank you for your deposit!\n\nInvoice: {{invoice_number}}\nDeposit amount: {{deposit_amount}}\nTotal invoice: {{total_amount}}\nRemaining balance: {{remaining_balance}}\nPayment date: {{payment_date}}',
   '["invoice_number", "client_name", "deposit_amount", "total_amount", "remaining_balance", "payment_date"]'::jsonb)
) AS template(type, subject, body_html, body_text, variables);

-- RLS Policies (commented out for development, uncomment for production)
/*
-- Enable RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_email_templates ENABLE ROW LEVEL SECURITY;

-- Shop settings policies
CREATE POLICY "Users can view their shop settings"
  ON shop_settings FOR SELECT
  USING (shop_id IN (
    SELECT id FROM shops WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their shop settings"
  ON shop_settings FOR ALL
  USING (shop_id IN (
    SELECT id FROM shops WHERE owner_user_id = auth.uid()
  ));

-- Invoice policies
CREATE POLICY "Users can view their shop's invoices"
  ON invoices FOR SELECT
  USING (shop_id IN (
    SELECT id FROM shops WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can create invoices for their shop"
  ON invoices FOR INSERT
  WITH CHECK (shop_id IN (
    SELECT id FROM shops WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their shop's invoices"
  ON invoices FOR UPDATE
  USING (shop_id IN (
    SELECT id FROM shops WHERE owner_user_id = auth.uid()
  ));

-- Payment policies
CREATE POLICY "Users can view payments for their shop's invoices"
  ON payments FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create payments for their shop's invoices"
  ON payments FOR INSERT
  WITH CHECK (invoice_id IN (
    SELECT id FROM invoices WHERE shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  ));

-- Payment link policies
CREATE POLICY "Users can view payment links for their shop"
  ON payment_links FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  ));

CREATE POLICY "Public can view active payment links by token"
  ON payment_links FOR SELECT
  USING (status = 'active' AND expires_at > now());

CREATE POLICY "Users can create payment links for their shop"
  ON payment_links FOR INSERT
  WITH CHECK (invoice_id IN (
    SELECT id FROM invoices WHERE shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  ));

-- Email template policies
CREATE POLICY "Users can view their shop's email templates"
  ON invoice_email_templates FOR SELECT
  USING (shop_id IN (
    SELECT id FROM shops WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their shop's email templates"
  ON invoice_email_templates FOR ALL
  USING (shop_id IN (
    SELECT id FROM shops WHERE owner_user_id = auth.uid()
  ));

-- Invoice status history policies
CREATE POLICY "Users can view status history for their shop's invoices"
  ON invoice_status_history FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  ));
*/

COMMIT;
