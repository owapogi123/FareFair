-- Migration: 20261028_05_locations_tourism
-- Description: Insert location records for tourist attractions in Manila/Intramuros area
-- Author: Farefair V1.4 Data Integration
-- Dependencies: locations table must exist
-- Run Order: 5 (before tourism_prices)
-- FIXES: Added UNIQUE constraint on (name, city) for idempotency; ON CONFLICT DO UPDATE preserves UUIDs.

-- ============================================================
-- ENSURE IDEMPOTENCY: UNIQUE CONSTRAINT ON NAME + CITY
-- ============================================================
-- Required for ON CONFLICT (name, city) to work. Safe: name+city uniquely identifies
-- a location in practice. IF NOT EXISTS guards re-runs.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'locations_name_city_key'
    ) THEN
        ALTER TABLE locations
        ADD CONSTRAINT locations_name_city_key UNIQUE (name, city);
    END IF;
END $$;

-- ============================================================
-- TOURISM LOCATIONS
-- ============================================================

DO $$
DECLARE
    loc_fort_santiago UUID;
    loc_casa_manila UUID;
    loc_centro_turismo UUID;
    loc_nat_museum UUID;
    loc_museo_intramuros UUID;
BEGIN
    -- Fort Santiago, Intramuros
    INSERT INTO locations (name, city, province, latitude, longitude, active)
    VALUES ('Fort Santiago', 'Manila', 'Metro Manila', 14.5928, 120.9702, true)
    ON CONFLICT (name, city) DO UPDATE SET
        province = EXCLUDED.province,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        active = EXCLUDED.active
    RETURNING id INTO loc_fort_santiago;

    -- Casa Manila Museum, Intramuros
    INSERT INTO locations (name, city, province, latitude, longitude, active)
    VALUES ('Casa Manila Museum', 'Manila', 'Metro Manila', 14.5905, 120.9710, true)
    ON CONFLICT (name, city) DO UPDATE SET
        province = EXCLUDED.province,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        active = EXCLUDED.active
    RETURNING id INTO loc_casa_manila;

    -- Centro de Turismo Intramuros
    INSERT INTO locations (name, city, province, latitude, longitude, active)
    VALUES ('Centro de Turismo Intramuros', 'Manila', 'Metro Manila', 14.5915, 120.9705, true)
    ON CONFLICT (name, city) DO UPDATE SET
        province = EXCLUDED.province,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        active = EXCLUDED.active
    RETURNING id INTO loc_centro_turismo;

    -- National Museum Complex (includes National Museum of Fine Arts, Anthropology, Natural History)
    INSERT INTO locations (name, city, province, latitude, longitude, active)
    VALUES ('National Museum Complex', 'Manila', 'Metro Manila', 14.5879, 120.9811, true)
    ON CONFLICT (name, city) DO UPDATE SET
        province = EXCLUDED.province,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        active = EXCLUDED.active
    RETURNING id INTO loc_nat_museum;

    -- Museo de Intramuros (CONFLICT in pricing)
    INSERT INTO locations (name, city, province, latitude, longitude, active)
    VALUES ('Museo de Intramuros', 'Manila', 'Metro Manila', 14.5910, 120.9708, true)
    ON CONFLICT (name, city) DO UPDATE SET
        province = EXCLUDED.province,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        active = EXCLUDED.active
    RETURNING id INTO loc_museo_intramuros;

END $$;

-- ============================================================
-- VALIDATION QUERIES
-- ============================================================
-- SELECT name, city, province, latitude, longitude, active FROM locations WHERE city = 'Manila' ORDER BY name;