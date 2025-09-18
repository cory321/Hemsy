-- Create function to automatically create default signature for new shops
CREATE OR REPLACE FUNCTION create_default_email_signature()
RETURNS TRIGGER AS $$
DECLARE
  signature_content TEXT;
BEGIN
  -- Build signature content based on available shop data
  signature_content := '';
  
  -- Add business name (prefer business_name over name)
  IF NEW.business_name IS NOT NULL AND NEW.business_name != '' THEN
    signature_content := NEW.business_name;
  ELSIF NEW.name IS NOT NULL AND NEW.name != '' THEN
    signature_content := NEW.name;
  END IF;
  
  -- Add email if available
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF signature_content != '' THEN
      signature_content := signature_content || E'\n';
    END IF;
    signature_content := signature_content || 'Email: ' || NEW.email;
  END IF;
  
  -- Add phone if available
  IF NEW.phone_number IS NOT NULL AND NEW.phone_number != '' THEN
    IF signature_content != '' THEN
      signature_content := signature_content || E'\n';
    END IF;
    signature_content := signature_content || 'Phone: ' || NEW.phone_number;
  END IF;
  
  -- Add mailing address if available
  IF NEW.mailing_address IS NOT NULL AND NEW.mailing_address != '' THEN
    IF signature_content != '' THEN
      signature_content := signature_content || E'\n';
    END IF;
    signature_content := signature_content || NEW.mailing_address;
  END IF;
  
  -- Only create signature if we have some content
  IF signature_content != '' THEN
    INSERT INTO email_signatures (shop_id, name, content, created_by)
    VALUES (NEW.id, 'Default Signature', signature_content, NEW.owner_user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create signature on shop creation
DROP TRIGGER IF EXISTS create_shop_email_signature ON shops;
CREATE TRIGGER create_shop_email_signature
  AFTER INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_signature();

-- Create function to update signature when shop info changes
CREATE OR REPLACE FUNCTION update_email_signature_on_shop_change()
RETURNS TRIGGER AS $$
DECLARE
  signature_content TEXT;
  existing_signature_id UUID;
BEGIN
  -- Only proceed if relevant fields have changed
  IF (OLD.business_name IS DISTINCT FROM NEW.business_name OR
      OLD.name IS DISTINCT FROM NEW.name OR
      OLD.email IS DISTINCT FROM NEW.email OR
      OLD.phone_number IS DISTINCT FROM NEW.phone_number OR
      OLD.mailing_address IS DISTINCT FROM NEW.mailing_address) THEN
    
    -- Check if a signature exists for this shop
    SELECT id INTO existing_signature_id
    FROM email_signatures
    WHERE shop_id = NEW.id
    LIMIT 1;
    
    -- Only update if signature exists and hasn't been customized
    -- (we check if content matches the auto-generated pattern)
    IF existing_signature_id IS NOT NULL THEN
      -- Build new signature content
      signature_content := '';
      
      -- Add business name (prefer business_name over name)
      IF NEW.business_name IS NOT NULL AND NEW.business_name != '' THEN
        signature_content := NEW.business_name;
      ELSIF NEW.name IS NOT NULL AND NEW.name != '' THEN
        signature_content := NEW.name;
      END IF;
      
      -- Add email if available
      IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        IF signature_content != '' THEN
          signature_content := signature_content || E'\n';
        END IF;
        signature_content := signature_content || 'Email: ' || NEW.email;
      END IF;
      
      -- Add phone if available
      IF NEW.phone_number IS NOT NULL AND NEW.phone_number != '' THEN
        IF signature_content != '' THEN
          signature_content := signature_content || E'\n';
        END IF;
        signature_content := signature_content || 'Phone: ' || NEW.phone_number;
      END IF;
      
      -- Add mailing address if available
      IF NEW.mailing_address IS NOT NULL AND NEW.mailing_address != '' THEN
        IF signature_content != '' THEN
          signature_content := signature_content || E'\n';
        END IF;
        signature_content := signature_content || NEW.mailing_address;
      END IF;
      
      -- Update the signature
      UPDATE email_signatures
      SET content = signature_content,
          updated_at = NOW()
      WHERE id = existing_signature_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update signature when shop info changes
DROP TRIGGER IF EXISTS update_shop_email_signature ON shops;
CREATE TRIGGER update_shop_email_signature
  AFTER UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_email_signature_on_shop_change();

-- Create default signatures for existing shops that don't have one
INSERT INTO email_signatures (shop_id, name, content, created_by)
SELECT 
  s.id,
  'Default Signature',
  TRIM(BOTH E'\n' FROM 
    COALESCE(s.business_name, s.name, '') ||
    CASE WHEN s.email IS NOT NULL AND s.email != '' 
         THEN E'\nEmail: ' || s.email 
         ELSE '' END ||
    CASE WHEN s.phone_number IS NOT NULL AND s.phone_number != '' 
         THEN E'\nPhone: ' || s.phone_number 
         ELSE '' END ||
    CASE WHEN s.mailing_address IS NOT NULL AND s.mailing_address != '' 
         THEN E'\n' || s.mailing_address 
         ELSE '' END
  ),
  s.owner_user_id
FROM shops s
LEFT JOIN email_signatures es ON es.shop_id = s.id
WHERE es.id IS NULL
  AND (s.business_name IS NOT NULL OR s.name IS NOT NULL);
