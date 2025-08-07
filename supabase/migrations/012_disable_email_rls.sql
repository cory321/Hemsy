-- Migration: Disable RLS on Email Tables
-- Version: 012  
-- Description: Disable Row Level Security on email tables since we use Clerk auth, not Supabase auth

-- Disable RLS on email_templates table
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for email_templates
DROP POLICY IF EXISTS "Users can read email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can create templates" ON email_templates;

-- Disable RLS on email_logs table  
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for email_logs
DROP POLICY IF EXISTS "Users can read own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can create email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can update own email logs" ON email_logs;

-- Disable RLS on confirmation_tokens table
ALTER TABLE confirmation_tokens DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for confirmation_tokens
DROP POLICY IF EXISTS "Users can read own confirmation tokens" ON confirmation_tokens;
DROP POLICY IF EXISTS "Users can create confirmation tokens" ON confirmation_tokens;
DROP POLICY IF EXISTS "Users can update own confirmation tokens" ON confirmation_tokens;

-- Disable RLS on user_email_settings table
ALTER TABLE user_email_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for user_email_settings
DROP POLICY IF EXISTS "Users can read own email settings" ON user_email_settings;
DROP POLICY IF EXISTS "Users can create own email settings" ON user_email_settings;
DROP POLICY IF EXISTS "Users can update own email settings" ON user_email_settings;

-- Fix foreign key references to use custom users table instead of auth.users
-- since we use Clerk authentication

-- Drop existing foreign key constraints
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey;
ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_created_by_fkey;  
ALTER TABLE confirmation_tokens DROP CONSTRAINT IF EXISTS confirmation_tokens_created_by_fkey;

-- Update created_by columns to reference the custom users table
ALTER TABLE email_templates ADD CONSTRAINT email_templates_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id);
  
ALTER TABLE email_logs ADD CONSTRAINT email_logs_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id);
  
ALTER TABLE confirmation_tokens ADD CONSTRAINT confirmation_tokens_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Note: Security is now enforced at the application layer through server actions
-- that verify Clerk authentication before database operations