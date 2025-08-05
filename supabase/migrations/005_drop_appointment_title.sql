-- Drop the title column from appointments table
-- The client's name will be used as the appointment identifier instead

-- Drop the column
ALTER TABLE appointments DROP COLUMN title;

-- Update the appointments insert/update functions if any exist that reference title
-- (None found in current migrations)