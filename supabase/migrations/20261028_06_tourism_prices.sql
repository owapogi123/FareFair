-- Migration: 20261028_06_tourism_prices
-- Description: Insert verified tourism prices from official sources
-- Author: Farefair V1.4 Data Integration
-- Dependencies: locations, sources populated
-- Run Order: 6
-- CRITICAL: Conflicting Museo de Intramuros prices quarantined with 'conflicting_data' status
-- price_type enum: official, establishment_published, estimated, user_reported, unverified
-- FIXES: Added UNIQUE constraint on (location_id, establishment_name, item_name) for idempotency; ON CONFLICT DO UPDATE preserves UUIDs.
-- CONFLICT HANDLING: Two Museo de Intramuros records have distinct item_name values, allowing both to coexist.
-- Conflict info traced via source_id to sources.information_supported (no tourism_prices.information_supported column needed).

-- ============================================================
-- ENSURE IDEMPOTENCY: UNIQUE CONSTRAINT ON BUSINESS KEY
-- ============================================================
-- Required for ON CONFLICT to work. Business key: location + establishment + item.
-- This allows different prices for same establishment (e.g., Museo conflicts).
-- IF NOT EXISTS guards re-runs.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tourism_prices_location_establishment_item_key'
    ) THEN
        ALTER TABLE tourism_prices
        ADD CONSTRAINT tourism_prices_location_establishment_item_key
        UNIQUE (location_id, establishment_name, item_name);
    END IF;
END $$;

-- ============================================================
-- TOURISM PRICES
-- ============================================================

DO $$
DECLARE
    src_ia_hours UUID;        -- Intramuros Admin Hours & Fees [12]
    src_ia_casa UUID;         -- Casa Manila [13]
    src_ia_guide UUID;        -- Museum Guide (conflict) [14]
    src_nat_museum UUID;      -- National Museum [15]

    loc_fort_santiago UUID;
    loc_casa_manila UUID;
    loc_centro_turismo UUID;
    loc_nat_museum UUID;
    loc_museo_intramuros UUID;
BEGIN
    -- Get source IDs
    SELECT id INTO src_ia_hours FROM sources WHERE url LIKE '%intramuros.gov.ph/hours/%' LIMIT 1;
    SELECT id INTO src_ia_casa FROM sources WHERE url LIKE '%intramuros.gov.ph/cmm/%' LIMIT 1;
    SELECT id INTO src_ia_guide FROM sources WHERE url LIKE '%intramuros.gov.ph/guide-museums/%' LIMIT 1;
    SELECT id INTO src_nat_museum FROM sources WHERE url LIKE '%reservation.nationalmuseum.gov.ph/%' LIMIT 1;

    -- Get location IDs
    SELECT id INTO loc_fort_santiago FROM locations WHERE name = 'Fort Santiago' AND city = 'Manila' LIMIT 1;
    SELECT id INTO loc_casa_manila FROM locations WHERE name = 'Casa Manila Museum' AND city = 'Manila' LIMIT 1;
    SELECT id INTO loc_centro_turismo FROM locations WHERE name = 'Centro de Turismo Intramuros' AND city = 'Manila' LIMIT 1;
    SELECT id INTO loc_nat_museum FROM locations WHERE name = 'National Museum Complex' AND city = 'Manila' LIMIT 1;
    SELECT id INTO loc_museo_intramuros FROM locations WHERE name = 'Museo de Intramuros' AND city = 'Manila' LIMIT 1;

    -- ============================================================
    -- VERIFIED TOURIST ATTRACTION PRICES
    -- ============================================================

    -- Fort Santiago (Intramuros Administration [12])
    INSERT INTO tourism_prices (
        category, establishment_name, item_name, price, discounted_price,
        price_type, location_id, verification_status, checked_at, source_id
    ) VALUES (
        'Historical Site', 'Fort Santiago', 'Regular Admission', 75.00, 50.00,
        'official', loc_fort_santiago, 'verified', '2026-10-28 00:00:00+00', src_ia_hours
    ) ON CONFLICT (location_id, establishment_name, item_name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        discounted_price = EXCLUDED.discounted_price,
        price_type = EXCLUDED.price_type,
        verification_status = EXCLUDED.verification_status,
        checked_at = EXCLUDED.checked_at,
        source_id = EXCLUDED.source_id;

    -- Casa Manila Museum (Intramuros Administration [13])
    INSERT INTO tourism_prices (
        category, establishment_name, item_name, price, discounted_price,
        price_type, location_id, verification_status, checked_at, source_id
    ) VALUES (
        'Museum', 'Casa Manila Museum', 'Regular Admission', 75.00, 50.00,
        'official', loc_casa_manila, 'verified', '2026-10-28 00:00:00+00', src_ia_casa
    ) ON CONFLICT (location_id, establishment_name, item_name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        discounted_price = EXCLUDED.discounted_price,
        price_type = EXCLUDED.price_type,
        verification_status = EXCLUDED.verification_status,
        checked_at = EXCLUDED.checked_at,
        source_id = EXCLUDED.source_id;

    -- Centro de Turismo Intramuros (Intramuros Administration [12])
    INSERT INTO tourism_prices (
        category, establishment_name, item_name, price, discounted_price,
        price_type, location_id, verification_status, checked_at, source_id
    ) VALUES (
        'Museum/Heritage Site', 'Centro de Turismo Intramuros', 'Paid Access', 150.00, 120.00,
        'official', loc_centro_turismo, 'verified', '2026-10-28 00:00:00+00', src_ia_hours
    ) ON CONFLICT (location_id, establishment_name, item_name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        discounted_price = EXCLUDED.discounted_price,
        price_type = EXCLUDED.price_type,
        verification_status = EXCLUDED.verification_status,
        checked_at = EXCLUDED.checked_at,
        source_id = EXCLUDED.source_id;

    -- National Museum Complex (FREE admission [15])
    INSERT INTO tourism_prices (
        category, establishment_name, item_name, price, discounted_price,
        price_type, location_id, verification_status, checked_at, source_id
    ) VALUES (
        'Museum', 'National Museum Complex', 'General Admission', 0.00, 0.00,
        'official', loc_nat_museum, 'verified', '2026-10-28 00:00:00+00', src_nat_museum
    ) ON CONFLICT (location_id, establishment_name, item_name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        discounted_price = EXCLUDED.discounted_price,
        price_type = EXCLUDED.price_type,
        verification_status = EXCLUDED.verification_status,
        checked_at = EXCLUDED.checked_at,
        source_id = EXCLUDED.source_id;

    -- ============================================================
    -- CONFLICTING RECORD - Museo de Intramuros
    -- Two IA pages disagree: Hours & Fees [12] says P150/P120 (under Centro de Turismo)
    -- Museum Guide [14] says P200/P160 for Museo specifically
    -- Both stored, flagged as conflicting_data, excluded from authoritative display
    -- ============================================================

    -- From Hours & Fees page (associated with Centro de Turismo line)
    INSERT INTO tourism_prices (
        category, establishment_name, item_name, price, discounted_price,
        price_type, location_id, verification_status, checked_at, source_id
    ) VALUES (
        'Museum', 'Museo de Intramuros', 'Admission (per Hours & Fees page)', 150.00, 120.00,
        'official', loc_museo_intramuros, 'conflicting_data', '2026-10-28 00:00:00+00', src_ia_hours
    ) ON CONFLICT (location_id, establishment_name, item_name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        discounted_price = EXCLUDED.discounted_price,
        price_type = EXCLUDED.price_type,
        verification_status = EXCLUDED.verification_status,
        checked_at = EXCLUDED.checked_at,
        source_id = EXCLUDED.source_id;

    -- From Museum Guide page
    INSERT INTO tourism_prices (
        category, establishment_name, item_name, price, discounted_price,
        price_type, location_id, verification_status, checked_at, source_id
    ) VALUES (
        'Museum', 'Museo de Intramuros', 'Admission (per Museum Guide page)', 200.00, 160.00,
        'official', loc_museo_intramuros, 'conflicting_data', '2026-10-28 00:00:00+00', src_ia_guide
    ) ON CONFLICT (location_id, establishment_name, item_name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        discounted_price = EXCLUDED.discounted_price,
        price_type = EXCLUDED.price_type,
        verification_status = EXCLUDED.verification_status,
        checked_at = EXCLUDED.checked_at,
        source_id = EXCLUDED.source_id;

    -- ============================================================
    -- NOTES ON EXCLUDED CATEGORIES (per research document)
    -- ============================================================
    -- Food, souvenirs, accommodation: No nationally regulated Manila price covers all street food,
    -- meals, magnets, shirts, souvenirs, private tours, or hotels.
    -- Farefair should show clearly labeled reported price ranges only, never use to accuse
    -- a seller of overcharging. These are NOT imported as authoritative prices.

END $$;

-- ============================================================
-- VALIDATION QUERIES
-- ============================================================
-- SELECT tp.*, l.name as location, s.organization as source_org
-- FROM tourism_prices tp
-- LEFT JOIN locations l ON tp.location_id = l.id
-- LEFT JOIN sources s ON tp.source_id = s.id
-- ORDER BY tp.category, tp.establishment_name;

-- Check verification statuses:
-- SELECT verification_status, count(*) FROM tourism_prices GROUP BY verification_status;
-- Expected: verified=4, conflicting_data=2

-- Verify conflicts quarantined:
-- SELECT establishment_name, item_name, price, discounted_price, verification_status, information_supported
-- FROM tourism_prices WHERE verification_status = 'conflicting_data';