-- init.sql
-- Schema definition for the LabFetch pickups table

CREATE TABLE IF NOT EXISTS pickups (
    id SERIAL PRIMARY KEY,
    nombre_mascota VARCHAR(255) NOT NULL,
    tipo_muestra VARCHAR(255) NOT NULL,
    departamento VARCHAR(100) NOT NULL, 
    ciudad VARCHAR(100) NOT NULL,
    tipo_via VARCHAR(50) NOT NULL,
    num_via_p1 VARCHAR(20) NOT NULL,
    letra_via VARCHAR(10),
    bis BOOLEAN DEFAULT FALSE,
    letra_bis VARCHAR(10),
    sufijo_cardinal1 VARCHAR(10), -- Renamed from cuadrante1
    num_via2 VARCHAR(20) NOT NULL,
    letra_via2 VARCHAR(10),
    sufijo_cardinal2 VARCHAR(10), -- Renamed from cuadrante2
    num3 VARCHAR(20) NOT NULL, -- Placa number
    complemento TEXT, -- For Apt, Torre, etc.
    direccion_completa TEXT, -- Store the generated full address string
    latitude DOUBLE PRECISION,  -- Added for coordinates
    longitude DOUBLE PRECISION, -- Added for coordinates
    
    fecha_preferida DATE, -- Changed from TIMESTAMP WITH TIME ZONE
    turno_preferido VARCHAR(10), -- Added for 'mañana' or 'tarde'
    
    status VARCHAR(50) DEFAULT 'pendiente', -- e.g., pendiente, asignado, recogido, cancelado
    driver_id INTEGER, -- Foreign key to a potential drivers table later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- Added for admin notes
    photo_path VARCHAR(512) -- Added for storing photo file path
    
    -- Optional: Add foreign key constraint if drivers table exists
    -- CONSTRAINT fk_driver FOREIGN KEY(driver_id) REFERENCES drivers(id)
);

-- Optional: Add index on status for faster querying
CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickups(status);

-- Optional: Add index on date/time for scheduling queries
-- Removed index: CREATE INDEX IF NOT EXISTS idx_pickups_fecha_hora ON pickups(fecha_hora_preferida); 
-- Optional: Add index for new date field if needed
-- CREATE INDEX IF NOT EXISTS idx_pickups_fecha_preferida ON pickups(fecha_preferida);

-- Optional: Add a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Optional: Add a trigger to call the function before update
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'update_pickups_updated_at'
   ) THEN
      CREATE TRIGGER update_pickups_updated_at
      BEFORE UPDATE ON pickups
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
   END IF;
END
$$;

-- === Admins Table ===
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Seed a default admin user (change password in production!)
-- Use a separate script or manual psql command to generate hash securely
-- Example: INSERT INTO admins (username, password_hash) VALUES ('admin', '<bcrypt_hash_of_password>');

-- Note: Consider adding constraints for enums like status if desired. 

-- === Settings Table ===
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