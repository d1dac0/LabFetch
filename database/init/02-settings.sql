-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on settings table update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_settings_timestamp' AND tgrelid = 'settings'::regclass
    ) THEN
        CREATE TRIGGER set_settings_timestamp
        BEFORE UPDATE ON settings
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END
$$;


-- Insert default pickup schedule message (only if it doesn't exist)
INSERT INTO settings (setting_key, setting_value)
VALUES ('pickup_schedule_message', 'Nuestro horario para programar recolecciones es de lunes a sábado de 9:30 AM hasta las 5:00 PM, Domingos de 9:30 AM hasta las 11:00 AM')
ON CONFLICT (setting_key) DO NOTHING; 