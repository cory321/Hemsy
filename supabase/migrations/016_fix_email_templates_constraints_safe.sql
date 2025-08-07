-- Migration: Safely Fix Email Templates Constraints
-- Version: 016
-- Description: Safely handle unique constraint changes for email templates

-- First, check if the old constraint exists and drop it if it does
DO $$ 
BEGIN
    -- Check if the old single-column unique constraint exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'email_templates_email_type_key' 
        AND conrelid = 'email_templates'::regclass
    ) THEN
        ALTER TABLE email_templates DROP CONSTRAINT email_templates_email_type_key;
        RAISE NOTICE 'Dropped old constraint email_templates_email_type_key';
    END IF;
    
    -- Check if the new composite unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'email_templates_email_type_created_by_key' 
        AND conrelid = 'email_templates'::regclass
    ) THEN
        ALTER TABLE email_templates ADD CONSTRAINT email_templates_email_type_created_by_key 
            UNIQUE (email_type, created_by);
        RAISE NOTICE 'Created new constraint email_templates_email_type_created_by_key';
    ELSE
        RAISE NOTICE 'Constraint email_templates_email_type_created_by_key already exists';
    END IF;
    
    -- Check if the index exists before creating it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_email_templates_created_by'
    ) THEN
        CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);
        RAISE NOTICE 'Created index idx_email_templates_created_by';
    ELSE
        RAISE NOTICE 'Index idx_email_templates_created_by already exists';
    END IF;
END $$;