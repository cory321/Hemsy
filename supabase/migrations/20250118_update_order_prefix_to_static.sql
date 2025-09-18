-- Update generate_order_number function to use static 'ORD' prefix instead of shop name
-- This changes the format from {SHOP_PREFIX}-{YEAR}-{SEQUENCE} to ORD-{YEAR}-{SEQUENCE}

CREATE OR REPLACE FUNCTION generate_order_number(p_shop_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_sequence INT;
  v_order_number TEXT;
BEGIN
  -- Get current year (2 digits)
  v_year := TO_CHAR(NOW(), 'YY');
  
  -- Get next sequence number
  v_sequence := nextval('order_number_seq');
  
  -- Format: ORD-YY-NNNN (e.g., ORD-24-0001)
  v_order_number := 'ORD-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_order_number;
END;
$$;

-- Add comment to document the change
COMMENT ON FUNCTION generate_order_number(UUID) IS 
'Generates order numbers in format ORD-YY-NNNN where YY is the 2-digit year and NNNN is a zero-padded sequence number';
