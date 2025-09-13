-- Fix garment history to track stage changes
-- The existing trigger was missing stage field tracking

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS track_garment_updates ON garments;
DROP FUNCTION IF EXISTS track_garment_changes();

-- Recreate the function with stage tracking
CREATE OR REPLACE FUNCTION track_garment_changes()
RETURNS TRIGGER AS $$
DECLARE
    user_id_setting TEXT;
BEGIN
    -- Get the current user ID setting
    user_id_setting := current_setting('app.current_user_id', true);
    
    -- Only track if we have a valid user_id in the context (not null and not empty)
    IF user_id_setting IS NOT NULL AND user_id_setting != '' THEN
        -- Track stage changes (store as plain text, not JSON)
        IF OLD.stage IS DISTINCT FROM NEW.stage THEN
            INSERT INTO public.garment_history (
                garment_id, changed_by, field_name, old_value, new_value, change_type
            ) VALUES (
                NEW.id, user_id_setting::UUID, 'stage', 
                OLD.stage::text, NEW.stage::text, 'field_update'
            );
        END IF;

        -- Track name changes
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            INSERT INTO public.garment_history (
                garment_id, changed_by, field_name, old_value, new_value, change_type
            ) VALUES (
                NEW.id, user_id_setting::UUID, 'name', 
                to_jsonb(OLD.name), to_jsonb(NEW.name), 'field_update'
            );
        END IF;
        
        -- Track due_date changes
        IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
            INSERT INTO public.garment_history (
                garment_id, changed_by, field_name, old_value, new_value, change_type
            ) VALUES (
                NEW.id, user_id_setting::UUID, 'due_date', 
                to_jsonb(OLD.due_date), to_jsonb(NEW.due_date), 'field_update'
            );
        END IF;
        
        -- Track event_date changes
        IF OLD.event_date IS DISTINCT FROM NEW.event_date THEN
            INSERT INTO public.garment_history (
                garment_id, changed_by, field_name, old_value, new_value, change_type
            ) VALUES (
                NEW.id, user_id_setting::UUID, 'event_date', 
                to_jsonb(OLD.event_date), to_jsonb(NEW.event_date), 'field_update'
            );
        END IF;
        
        -- Track preset_icon_key changes
        IF OLD.preset_icon_key IS DISTINCT FROM NEW.preset_icon_key THEN
            INSERT INTO public.garment_history (
                garment_id, changed_by, field_name, old_value, new_value, change_type
            ) VALUES (
                NEW.id, user_id_setting::UUID, 'icon', 
                to_jsonb(OLD.preset_icon_key), to_jsonb(NEW.preset_icon_key), 'field_update'
            );
        END IF;

        -- Track preset_fill_color changes
        IF OLD.preset_fill_color IS DISTINCT FROM NEW.preset_fill_color THEN
            INSERT INTO public.garment_history (
                garment_id, changed_by, field_name, old_value, new_value, change_type
            ) VALUES (
                NEW.id, user_id_setting::UUID, 'fill_color', 
                to_jsonb(OLD.preset_fill_color), to_jsonb(NEW.preset_fill_color), 'field_update'
            );
        END IF;

        -- Track notes changes
        IF OLD.notes IS DISTINCT FROM NEW.notes THEN
            INSERT INTO public.garment_history (
                garment_id, changed_by, field_name, old_value, new_value, change_type
            ) VALUES (
                NEW.id, user_id_setting::UUID, 'notes', 
                to_jsonb(OLD.notes), to_jsonb(NEW.notes), 'field_update'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER track_garment_updates
AFTER UPDATE ON garments
FOR EACH ROW
EXECUTE FUNCTION track_garment_changes();
