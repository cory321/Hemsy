-- Remove the trigger that updates stage without recording history
-- The application code already handles stage updates and properly records history

DROP TRIGGER IF EXISTS update_garment_on_service_change ON garment_services;
DROP FUNCTION IF EXISTS update_garment_stage_from_services();

-- Note: The application code in garment-services.ts already:
-- 1. Records service completion in history
-- 2. Calls recalculateAndUpdateGarmentStage which records stage changes in history
-- So we don't need this trigger anymore

-- The flow now works as follows:
-- 1. User marks service as complete
-- 2. toggleServiceCompletion records "Service completed: [Service Name]" in history
-- 3. recalculateAndUpdateGarmentStage is called
-- 4. If all services are complete, it updates stage to "Ready For Pickup"
-- 5. updateGarmentStage records "Garment completed" in history
-- 6. Both entries appear in the change history
