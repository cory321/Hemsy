-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    accept_email BOOLEAN DEFAULT TRUE,
    accept_sms BOOLEAN DEFAULT FALSE,
    notes TEXT,
    mailing_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_clients_shop_id ON public.clients(shop_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_name ON public.clients(first_name, last_name);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see clients that belong to their shop
CREATE POLICY "Users can view their shop's clients" ON public.clients
    FOR SELECT
    USING (
        shop_id IN (
            SELECT id FROM public.shops 
            WHERE owner_user_id = auth.uid()
        )
    );

-- Users can create clients for their shop
CREATE POLICY "Users can create clients for their shop" ON public.clients
    FOR INSERT
    WITH CHECK (
        shop_id IN (
            SELECT id FROM public.shops 
            WHERE owner_user_id = auth.uid()
        )
    );

-- Users can update their shop's clients
CREATE POLICY "Users can update their shop's clients" ON public.clients
    FOR UPDATE
    USING (
        shop_id IN (
            SELECT id FROM public.shops 
            WHERE owner_user_id = auth.uid()
        )
    );

-- Users can delete their shop's clients
CREATE POLICY "Users can delete their shop's clients" ON public.clients
    FOR DELETE
    USING (
        shop_id IN (
            SELECT id FROM public.shops 
            WHERE owner_user_id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();