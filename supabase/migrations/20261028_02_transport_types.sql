-- Migration: 20261028_02_transport_types
-- Description: Insert/update transport type records from LTFRB fare guides (effective 28 Sept 2026)
-- Author: Farefair V1.4 Data Integration
-- Dependencies: transport_types table must exist; sources table populated (migration 01)
-- Run Order: 2
-- FIXES: Added UNIQUE constraint on name for idempotency; removed dead source lookup code;
--        cleaned descriptions (audit notes moved to fare_rules.information_supported).

-- ============================================================
-- ENSURE IDEMPOTENCY: UNIQUE CONSTRAINT ON NAME
-- ============================================================
-- Required for ON CONFLICT (name) to work. Safe: name is NOT NULL in all rows,
-- no legitimate duplicates expected. IF NOT EXISTS guards re-runs.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transport_types_name_key'
    ) THEN
        ALTER TABLE transport_types
        ADD CONSTRAINT transport_types_name_key UNIQUE (name);
    END IF;
END $$;

-- ============================================================
-- TRANSPORT TYPES
-- ============================================================
-- icon: emoji identifier for UI (not displayed in all contexts)
-- active: true for currently operating services
-- ON CONFLICT (name) DO UPDATE preserves original UUID (critical for FK references
-- from fare_rules, routes, discount_types.applicable_transports).

INSERT INTO transport_types (name, description, icon, active)
VALUES
-- Metro Manila PUVs
('Traditional Jeepney', 'Traditional Public Utility Jeepney (PUJ) - iconic Filipino jeepney', '🚐', true),
('Modern Jeepney', 'Modern Public Utility Jeepney (PUJ) - Euro 4/5 compliant, improved seating', '🚐', true),
('Ordinary City Bus', 'Non-air-conditioned city bus (ordinary)', '🚌', true),
('Air-conditioned City Bus', 'Air-conditioned city bus (city service)', '🚌', true),
('EDSA Busway', 'Dedicated EDSA Busway service (A/C)', '🚌', true),
-- Provincial Buses
('Provincial Bus - Ordinary', 'Ordinary provincial bus (non-A/C, basic)', '🚌', true),
('Provincial Bus - Air-conditioned', 'Air-conditioned provincial bus', '🚌', true),
('Provincial Bus - Deluxe', 'Deluxe provincial bus (reclining seats, better amenities)', '🚌', true),
('Provincial Bus - Super Deluxe', 'Super Deluxe provincial bus (enhanced comfort)', '🚌', true),
('Provincial Bus - Luxury', 'Luxury provincial bus (premium amenities)', '🚌', true),
-- Taxis
('Regular Taxi', 'Standard metered taxi', '🚕', true),
('Premium Silver Taxi', 'Premium Silver metered taxi', '🚕', true),
('Premium Gold Taxi', 'Premium Gold metered taxi', '🚕', true),
('Airport Taxi', 'Airport taxi (implemented fare adjustment)', '🚕', true),
-- TNVS (Ride-hailing)
('TNVS - Hatchback/Subcompact', 'Transport Network Vehicle Service - Hatchback/Subcompact class', '🚗', true),
('TNVS - Sedan', 'Transport Network Vehicle Service - Sedan class', '🚗', true),
('TNVS - AUV/SUV', 'Transport Network Vehicle Service - AUV/SUV class', '🚗', true),
('TNVS - Premium', 'Transport Network Vehicle Service - Premium class', '🚗', true),
-- UV Express
('Traditional UV Express', 'Traditional UV Express van', '🚐', true),
('Modern UV Express', 'Modern UV Express van', '🚐', true),
-- Other
('P2P Bus', 'Point-to-Point bus', '🚌', true),
('Tricycle', 'Local tricycle', '🛺', true),
('Motorcycle Taxi', 'Motorcycle taxi', '🏍️', true),
-- Rail
('MRT-3', 'Metro Rail Transit Line 3', '🚇', true),
('LRT-1', 'Light Rail Transit Line 1', '🚇', true),
('LRT-2', 'Light Rail Transit Line 2', '🚇', true),
-- Ferry
('Domestic Ferry/RoRo', 'Domestic ferry / Roll-on Roll-off', '⛴️', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    active = EXCLUDED.active,
    updated_at = now();

-- ============================================================
-- VALIDATION QUERIES (run after migration to verify)
-- ============================================================
-- SELECT count(*) FROM transport_types WHERE active = true;  -- expect 27
-- SELECT name, icon, active FROM transport_types ORDER BY name;
--
-- Idempotency test (run migration twice):
-- 1. First run → 27 rows inserted, UUIDs generated
-- 2. Second run → 0 new rows, existing updated in-place, UUIDs unchanged
-- 3. Verify: SELECT id, name FROM transport_types ORDER BY name;  -- same UUIDs both runs
-- 4. Verify FK preservation: SELECT tt.id, fr.transport_type_id
--    FROM transport_types tt LEFT JOIN fare_rules fr ON tt.id = fr.transport_type_id
--    WHERE tt.name = 'Traditional Jeepney';