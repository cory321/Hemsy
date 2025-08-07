-- Migration: Fix user_email_settings foreign key reference
-- Version: 013  
-- Description: Update user_email_settings table to reference public.users instead of auth.users

-- Drop the existing foreign key constraint
ALTER TABLE user_email_settings DROP CONSTRAINT IF EXISTS user_email_settings_user_id_fkey;

-- Update the foreign key to reference public.users instead of auth.users
ALTER TABLE user_email_settings ADD CONSTRAINT user_email_settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;