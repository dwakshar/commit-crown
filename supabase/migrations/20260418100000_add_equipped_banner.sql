-- Add equipped_banner_id to kingdoms to track which banner skin is equipped
ALTER TABLE kingdoms
  ADD COLUMN IF NOT EXISTS equipped_banner_id uuid
    REFERENCES shop_items(id)
    ON DELETE SET NULL;
