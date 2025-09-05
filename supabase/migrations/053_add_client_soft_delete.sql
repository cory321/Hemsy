-- Add soft delete columns to clients table for archiving functionality
-- This allows us to preserve all client data and relationships while hiding them from active lists

-- Add soft delete columns
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.users(id);

-- Create index for performance when filtering active/archived clients
CREATE INDEX IF NOT EXISTS idx_clients_is_archived ON public.clients(is_archived);
CREATE INDEX IF NOT EXISTS idx_clients_archived_at ON public.clients(archived_at);

-- Add comment explaining the columns
COMMENT ON COLUMN public.clients.is_archived IS 'Soft delete flag - when true, client is hidden from active lists but data is preserved';
COMMENT ON COLUMN public.clients.archived_at IS 'Timestamp when the client was archived';
COMMENT ON COLUMN public.clients.archived_by IS 'User who archived the client';

-- Create or replace function to handle archiving
CREATE OR REPLACE FUNCTION public.archive_client(
    p_client_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE public.clients
    SET 
        is_archived = TRUE,
        archived_at = NOW(),
        archived_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_client_id
    AND is_archived = FALSE; -- Prevent re-archiving
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client not found or already archived';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to restore archived client
CREATE OR REPLACE FUNCTION public.restore_client(
    p_client_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE public.clients
    SET 
        is_archived = FALSE,
        archived_at = NULL,
        archived_by = NULL,
        updated_at = NOW()
    WHERE id = p_client_id
    AND is_archived = TRUE; -- Only restore if archived
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client not found or not archived';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.archive_client(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_client(UUID) TO authenticated;
