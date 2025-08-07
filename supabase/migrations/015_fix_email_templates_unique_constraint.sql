-- Migration: Fix Email Templates Unique Constraint
-- Version: 015
-- Description: Change unique constraint from email_type to (email_type, created_by) to allow multiple users to have templates

-- Drop the existing unique constraint on email_type
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_email_type_key;

-- Add a new unique constraint on the combination of email_type and created_by
-- This allows each user to have their own set of email templates
ALTER TABLE email_templates ADD CONSTRAINT email_templates_email_type_created_by_key 
  UNIQUE (email_type, created_by);

-- Add index to improve query performance when filtering by created_by
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);