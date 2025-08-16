-- Add first_name and last_name columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update existing users with placeholder values if needed
UPDATE public.users 
SET 
  first_name = COALESCE(first_name, 'User'),
  last_name = COALESCE(last_name, 'Name')
WHERE first_name IS NULL OR last_name IS NULL;
