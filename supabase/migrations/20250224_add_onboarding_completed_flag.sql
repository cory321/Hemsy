-- Add onboarding_completed flag to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing shops as onboarding completed (they're already using the system)
UPDATE shops
SET onboarding_completed = TRUE
WHERE onboarding_completed IS FALSE;

-- Add comment
COMMENT ON COLUMN shops.onboarding_completed IS 'Indicates whether the shop owner has completed the onboarding process with required information';
