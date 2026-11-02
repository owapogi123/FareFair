-- Migration: 20261028_07_rail_fare_matrices
-- Description: Insert verified MRT-3 and LRT-2 station-to-station fare matrices (50% promotional fares)
-- Author: Farefair V1.4 Data Integration
-- Dependencies: transport_types, locations, sources, routes, fare_matrices tables must exist
-- Run Order: 7
-- CRITICAL: Only inserts explicitly documented station pairs from official Citizens Charters.
--           Does NOT invent missing station pairs, regular (pre-discount) fares, or promotional end dates.
--           Regular fares are not imported because they are not published in the research document.
--           Promotional fares stored as fare_amount (current payable fare); discounted_fare_amount left NULL.
--           Verification status 'verified' for promotional fares per official matrices.

DO $$
DECLARE
    src_lrta_charter UUID;   -- LRTA Citizens Charter 2026 2nd Ed [06]
    src_mrt3_charter UUID;   -- DOTr MRT-3 Citizens Charter 2026 1st Ed [07]
    tt_mrt3 UUID;
    tt_lrt2 UUID;

    -- Station location IDs
    loc_north_ave UUID;
    loc_quezon_ave UUID;
    loc_araneta_cubao UUID;
    loc_taft_ave UUID;
    loc_recto UUID;
    loc_legarda UUID;
    loc_antipolo UUID;
BEGIN
    -- Get source IDs
    SELECT id INTO src_lrta_charter FROM sources WHERE url LIKE '%lrta.gov.ph/wp-content/uploads/2026/03/Citizens-Charter-Handbook-2026-2nd-Edition.pdf%' LIMIT 1;
    SELECT id INTO src_mrt3_charter FROM sources WHERE url LIKE '%dotrmrt3.gov.ph/dotrmrt3-citizen-charter-handbook-2026-1st-edition.pdf%' LIMIT 1;

    -- Get transport type IDs
    SELECT id INTO tt_mrt3 FROM transport_types WHERE name = 'MRT-3' LIMIT 1;
    SELECT id INTO tt_lrt2 FROM transport_types WHERE name = 'LRT-2' LIMIT 1;

    -- ============================================================
    -- CREATE STATION LOCATIONS (if not exist)
    -- ============================================================
    INSERT INTO locations (name, city, province, latitude, longitude, active) VALUES
    ('North Avenue Station', 'Quezon City', 'Metro Manila', 14.6520, 121.0350, true),
    ('Quezon Avenue Station', 'Quezon City', 'Metro Manila', 14.6340, 121.0250, true),
    ('Araneta Center-Cubao Station', 'Quezon City', 'Metro Manila', 14.6180, 121.0520, true),
    ('Taft Avenue Station', 'Pasay', 'Metro Manila', 14.5400, 121.0000, true),
    ('Recto Station', 'Manila', 'Metro Manila', 14.6030, 120.9850, true),
    ('Legarda Station', 'Manila', 'Metro Manila', 14.6020, 120.9890, true),
    ('Antipolo Station', 'Antipolo', 'Rizal', 14.5850, 121.1750, true)
    ON CONFLICT (name) DO NOTHING;

    -- Get location IDs
    SELECT id INTO loc_north_ave FROM locations WHERE name = 'North Avenue Station' LIMIT 1;
    SELECT id INTO loc_quezon_ave FROM locations WHERE name = 'Quezon Avenue Station' LIMIT 1;
    SELECT id INTO loc_araneta_cubao FROM locations WHERE name = 'Araneta Center-Cubao Station' LIMIT 1;
    SELECT id INTO loc_taft_ave FROM locations WHERE name = 'Taft Avenue Station' LIMIT 1;
    SELECT id INTO loc_recto FROM locations WHERE name = 'Recto Station' LIMIT 1;
    SELECT id INTO loc_legarda FROM locations WHERE name = 'Legarda Station' LIMIT 1;
    SELECT id INTO loc_antipolo FROM locations WHERE name = 'Antipolo Station' LIMIT 1;

    -- ============================================================
    -- CREATE ROUTES FOR DOCUMENTED STATION PAIRS
    -- ============================================================
    -- MRT-3 pairs (from [07] DOTr MRT-3 Citizens Charter)
    INSERT INTO routes (transport_type_id, origin_location_id, destination_location_id, route_name, distance_km, verification_status, verified_at)
    VALUES
    (tt_mrt3, loc_north_ave, loc_araneta_cubao, 'North Avenue → Araneta Center-Cubao', NULL, 'verified', now()),
    (tt_mrt3, loc_north_ave, loc_taft_ave, 'North Avenue → Taft Avenue', NULL, 'verified', now()),
    (tt_mrt3, loc_quezon_ave, loc_taft_ave, 'Quezon Avenue → Taft Avenue', NULL, 'verified', now()),
    (tt_mrt3, loc_araneta_cubao, loc_taft_ave, 'Araneta Center-Cubao → Taft Avenue', NULL, 'verified', now())
    ON CONFLICT DO NOTHING;

    -- LRT-2 pairs (from [06] LRTA Citizens Charter 2nd Ed Annex A)
    INSERT INTO routes (transport_type_id, origin_location_id, destination_location_id, route_name, distance_km, verification_status, verified_at)
    VALUES
    (tt_lrt2, loc_recto, loc_legarda, 'Recto → Legarda', NULL, 'verified', now()),
    (tt_lrt2, loc_recto, loc_araneta_cubao, 'Recto → Araneta Center-Cubao', NULL, 'verified', now()),
    (tt_lrt2, loc_recto, loc_antipolo, 'Recto → Antipolo', NULL, 'verified', now()),
    (tt_lrt2, loc_araneta_cubao, loc_antipolo, 'Araneta Center-Cubao → Antipolo', NULL, 'verified', now())
    ON CONFLICT DO NOTHING;

    -- ============================================================
    -- INSERT FARE MATRICES (Promotional 50% fares as current payable fares)
    -- ============================================================
    -- MRT-3 promotional fares (single fare per pair, 50% discount for all passengers)
    -- Source: DOTr MRT-3 Citizens Charter [07], effective 2026-03-23 until further notice
    INSERT INTO fare_matrices (route_id, fare_amount, discounted_fare_amount, verification_status, effective_from, effective_until, source_id)
    SELECT r.id, fm.fare_amount, NULL, 'verified', '2026-03-23', NULL, src_mrt3_charter
    FROM (VALUES
        ('North Avenue → Araneta Center-Cubao', 8.00),
        ('North Avenue → Taft Avenue', 14.00),
        ('Quezon Avenue → Taft Avenue', 14.00),
        ('Araneta Center-Cubao → Taft Avenue', 12.00)
    ) AS fm(route_name, fare_amount)
    JOIN routes r ON r.route_name = fm.route_name AND r.transport_type_id = tt_mrt3
    ON CONFLICT DO NOTHING;

    -- LRT-2 promotional fares (single journey and stored value)
    -- Source: LRTA Citizens Charter 2026 2nd Ed Annex A [06], effective 2026-03-23 until further notice
    -- We store single journey promotional fare as fare_amount; stored value promotional fare as discounted_fare_amount
    -- (both are 50% promotional fares for different ticket types)
    INSERT INTO fare_matrices (route_id, fare_amount, discounted_fare_amount, verification_status, effective_from, effective_until, source_id)
    SELECT r.id, fm.single_journey, fm.stored_value, 'verified', '2026-03-23', NULL, src_lrta_charter
    FROM (VALUES
        ('Recto → Legarda', 8.00, 7.50),
        ('Recto → Araneta Center-Cubao', 13.00, 11.50),
        ('Recto → Antipolo', 18.00, 16.50),
        ('Araneta Center-Cubao → Antipolo', 13.00, 11.50)
    ) AS fm(route_name, single_journey, stored_value)
    JOIN routes r ON r.route_name = fm.route_name AND r.transport_type_id = tt_lrt2
    ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- VALIDATION QUERIES
-- ============================================================
-- Check inserted fare matrices with route names
-- SELECT fm.*, r.route_name, tt.name as transport_type
-- FROM fare_matrices fm
-- JOIN routes r ON fm.route_id = r.id
-- JOIN transport_types tt ON r.transport_type_id = tt.id
-- ORDER BY tt.name, r.route_name;

-- Verify counts:
-- SELECT tt.name, count(*) FROM fare_matrices fm
-- JOIN routes r ON fm.route_id = r.id
-- JOIN transport_types tt ON r.transport_type_id = tt.id
-- GROUP BY tt.name;
-- Expected: MRT-3 = 4, LRT-2 = 4

-- Check verification statuses:
-- SELECT verification_status, count(*) FROM fare_matrices GROUP BY verification_status;
-- Expected: verified = 8

-- Check missing regular fares (fare_amount is promotional, discounted_fare_amount NULL for MRT-3)
-- SELECT * FROM fare_matrices WHERE discounted_fare_amount IS NULL;