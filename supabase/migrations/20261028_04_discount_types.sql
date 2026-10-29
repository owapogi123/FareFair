-- Migration: 20261028_04_discount_types
-- Description: Insert discount types - statutory discounts separated from temporary rail promotions
-- Author: Farefair V1.4 Data Integration
-- Dependencies: transport_types, sources populated
-- Run Order: 4
-- CRITICAL: Statutory discounts (permanent laws) vs temporary promotions (time-limited)
-- FIXES: Added UNIQUE constraint on name for idempotency; ON CONFLICT DO UPDATE preserves UUIDs.

-- ============================================================
-- ENSURE IDEMPOTENCY: UNIQUE CONSTRAINT ON NAME
-- ============================================================
-- Required for ON CONFLICT (name) to work. Safe: name is NOT NULL in all rows,
-- no legitimate duplicates expected. IF NOT EXISTS guards re-runs.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'discount_types_name_key'
    ) THEN
        ALTER TABLE discount_types
        ADD CONSTRAINT discount_types_name_key UNIQUE (name);
    END IF;
END $$;

-- ============================================================
-- DISCOUNT TYPES
-- ============================================================

DO $$
DECLARE
    src_ra11314 UUID;   -- Student Fare Discount Act
    src_ra9994 UUID;    -- Senior Citizens Act
    src_ra10754 UUID;   -- PWD Benefits Act
    src_rail_promo UUID; -- DOTr/LRTA 50% rail promo
    src_gma_news UUID;  -- GMA News corroboration

    tt_trad_jeep UUID;
    tt_mod_jeep UUID;
    tt_ord_bus UUID;
    tt_ac_bus UUID;
    tt_edsa_busway UUID;
    tt_prov_ord UUID;
    tt_prov_ac UUID;
    tt_prov_deluxe UUID;
    tt_prov_super_deluxe UUID;
    tt_prov_luxury UUID;
    tt_reg_taxi UUID;
    tt_prem_silver UUID;
    tt_prem_gold UUID;
    tt_airport_taxi UUID;
    tt_tnvs_hatch UUID;
    tt_tnvs_sedan UUID;
    tt_tnvs_auv UUID;
    tt_tnvs_prem UUID;
    tt_uv_trad UUID;
    tt_uv_mod UUID;
    tt_p2p UUID;
    tt_tricycle UUID;
    tt_mcycle UUID;
    tt_mrt3 UUID;
    tt_lrt1 UUID;
    tt_lrt2 UUID;
    tt_ferry UUID;
BEGIN
    -- Get source IDs
    SELECT id INTO src_ra11314 FROM sources WHERE url LIKE '%lawphil.net/statutes/repacts/ra2019/ra_11314_2019.html%' LIMIT 1;
    SELECT id INTO src_ra9994 FROM sources WHERE url LIKE '%lawphil.net/statutes/repacts/ra2010/ra_9994_2010.html%' LIMIT 1;
    SELECT id INTO src_ra10754 FROM sources WHERE url LIKE '%lawphil.net/statutes/repacts/ra2016/ra_10754_2016.html%' LIMIT 1;
    SELECT id INTO src_rail_promo FROM sources WHERE url LIKE '%lrta.gov.ph/tickets-and-fares/%' LIMIT 1;
    SELECT id INTO src_gma_news FROM sources WHERE url LIKE '%gmanetwork.com/news/topstories/nation/980582%' LIMIT 1;

    -- Get transport type IDs for applicable_transports array
    SELECT id INTO tt_trad_jeep FROM transport_types WHERE name = 'Traditional Jeepney';
    SELECT id INTO tt_mod_jeep FROM transport_types WHERE name = 'Modern Jeepney';
    SELECT id INTO tt_ord_bus FROM transport_types WHERE name = 'Ordinary City Bus';
    SELECT id INTO tt_ac_bus FROM transport_types WHERE name = 'Air-conditioned City Bus';
    SELECT id INTO tt_edsa_busway FROM transport_types WHERE name = 'EDSA Busway';
    SELECT id INTO tt_prov_ord FROM transport_types WHERE name = 'Provincial Bus - Ordinary';
    SELECT id INTO tt_prov_ac FROM transport_types WHERE name = 'Provincial Bus - Air-conditioned';
    SELECT id INTO tt_prov_deluxe FROM transport_types WHERE name = 'Provincial Bus - Deluxe';
    SELECT id INTO tt_prov_super_deluxe FROM transport_types WHERE name = 'Provincial Bus - Super Deluxe';
    SELECT id INTO tt_prov_luxury FROM transport_types WHERE name = 'Provincial Bus - Luxury';
    SELECT id INTO tt_reg_taxi FROM transport_types WHERE name = 'Regular Taxi';
    SELECT id INTO tt_prem_silver FROM transport_types WHERE name = 'Premium Silver Taxi';
    SELECT id INTO tt_prem_gold FROM transport_types WHERE name = 'Premium Gold Taxi';
    SELECT id INTO tt_airport_taxi FROM transport_types WHERE name = 'Airport Taxi';
    SELECT id INTO tt_tnvs_hatch FROM transport_types WHERE name = 'TNVS - Hatchback/Subcompact';
    SELECT id INTO tt_tnvs_sedan FROM transport_types WHERE name = 'TNVS - Sedan';
    SELECT id INTO tt_tnvs_auv FROM transport_types WHERE name = 'TNVS - AUV/SUV';
    SELECT id INTO tt_tnvs_prem FROM transport_types WHERE name = 'TNVS - Premium';
    SELECT id INTO tt_uv_trad FROM transport_types WHERE name = 'Traditional UV Express';
    SELECT id INTO tt_uv_mod FROM transport_types WHERE name = 'Modern UV Express';
    SELECT id INTO tt_p2p FROM transport_types WHERE name = 'P2P Bus';
    SELECT id INTO tt_tricycle FROM transport_types WHERE name = 'Tricycle';
    SELECT id INTO tt_mcycle FROM transport_types WHERE name = 'Motorcycle Taxi';
    SELECT id INTO tt_mrt3 FROM transport_types WHERE name = 'MRT-3';
    SELECT id INTO tt_lrt1 FROM transport_types WHERE name = 'LRT-1';
    SELECT id INTO tt_lrt2 FROM transport_types WHERE name = 'LRT-2';
    SELECT id INTO tt_ferry FROM transport_types WHERE name = 'Domestic Ferry/RoRo';

    -- ============================================================
    -- STATUTORY DISCOUNTS (Permanent Laws) - VERIFIED
    -- ============================================================

    -- Student Discount (RA 11314) - 20% on eligible public transport
    INSERT INTO discount_types (
        name, description, percentage, eligibility, required_documents,
        citizenship_restrictions, legal_basis, applicable_transports,
        effective_from, effective_until, active, verification_status, source_id
    ) VALUES (
        'Student Fare Discount',
        '20% fare discount on eligible public transportation for Filipino enrolled students',
        20.00,
        'Filipino citizen enrolled in elementary, high school, technical-vocational, or college/university. Excludes post-graduate and specified short courses. Valid while enrolled including weekends and holidays.',
        'Valid school ID or enrollment certificate with photo, or student fare ID issued by school',
        'Filipino citizen only',
        'Republic Act No. 11314 (Student Fare Discount Act of 2019)',
        ARRAY[tt_trad_jeep, tt_mod_jeep, tt_ord_bus, tt_ac_bus, tt_edsa_busway,
              tt_prov_ord, tt_prov_ac, tt_prov_deluxe, tt_prov_super_deluxe, tt_prov_luxury,
              tt_uv_trad, tt_uv_mod, tt_p2p, tt_mrt3, tt_lrt1, tt_lrt2],
        '2019-04-17', NULL, true, 'verified', src_ra11314
    ) ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        percentage = EXCLUDED.percentage,
        eligibility = EXCLUDED.eligibility,
        required_documents = EXCLUDED.required_documents,
        citizenship_restrictions = EXCLUDED.citizenship_restrictions,
        legal_basis = EXCLUDED.legal_basis,
        applicable_transports = EXCLUDED.applicable_transports,
        effective_from = EXCLUDED.effective_from,
        effective_until = EXCLUDED.effective_until,
        active = EXCLUDED.active,
        verification_status = EXCLUDED.verification_status,
        source_id = EXCLUDED.source_id;

    -- Senior Citizen Discount (RA 9994) - 20% on covered transport
    INSERT INTO discount_types (
        name, description, percentage, eligibility, required_documents,
        citizenship_restrictions, legal_basis, applicable_transports,
        effective_from, effective_until, active, verification_status, source_id
    ) VALUES (
        'Senior Citizen Fare Discount',
        '20% fare discount on covered public transportation for qualified senior citizens',
        20.00,
        'Filipino citizen aged 60 years and above. Must present valid Senior Citizen ID (OSCA-issued) or other government-issued ID showing age and citizenship. Resident citizen requirement applies.',
        'Senior Citizen ID card (OSCA) or government-issued ID with birthdate and citizenship',
        'Filipino citizen resident only',
        'Republic Act No. 9994 (Expanded Senior Citizens Act of 2010)',
        ARRAY[tt_trad_jeep, tt_mod_jeep, tt_ord_bus, tt_ac_bus, tt_edsa_busway,
              tt_prov_ord, tt_prov_ac, tt_prov_deluxe, tt_prov_super_deluxe, tt_prov_luxury,
              tt_uv_trad, tt_uv_mod, tt_p2p, tt_mrt3, tt_lrt1, tt_lrt2, tt_reg_taxi,
              tt_prem_silver, tt_prem_gold, tt_airport_taxi],
        '2010-02-15', NULL, true, 'verified', src_ra9994
    ) ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        percentage = EXCLUDED.percentage,
        eligibility = EXCLUDED.eligibility,
        required_documents = EXCLUDED.required_documents,
        citizenship_restrictions = EXCLUDED.citizenship_restrictions,
        legal_basis = EXCLUDED.legal_basis,
        applicable_transports = EXCLUDED.applicable_transports,
        effective_from = EXCLUDED.effective_from,
        effective_until = EXCLUDED.effective_until,
        active = EXCLUDED.active,
        verification_status = EXCLUDED.verification_status,
        source_id = EXCLUDED.source_id;

    -- PWD Discount (RA 10754) - At least 20% on covered transport
    INSERT INTO discount_types (
        name, description, percentage, eligibility, required_documents,
        citizenship_restrictions, legal_basis, applicable_transports,
        effective_from, effective_until, active, verification_status, source_id
    ) VALUES (
        'Person with Disability (PWD) Fare Discount',
        'At least 20% fare discount on covered public transportation for qualified PWDs',
        20.00,
        'Filipino citizen with disability as defined by law. Must present valid PWD ID (issued by NCWDP/MSWDO) or government-issued ID with PWD designation. Non-stacking with other 50% promotions applies.',
        'PWD ID card (NCWDP/MSWDO) or government-issued ID with PWD designation',
        'Filipino citizen only',
        'Republic Act No. 10754 (Expanded PWD Benefits Act of 2016)',
        ARRAY[tt_trad_jeep, tt_mod_jeep, tt_ord_bus, tt_ac_bus, tt_edsa_busway,
              tt_prov_ord, tt_prov_ac, tt_prov_deluxe, tt_prov_super_deluxe, tt_prov_luxury,
              tt_uv_trad, tt_uv_mod, tt_p2p, tt_mrt3, tt_lrt1, tt_lrt2, tt_reg_taxi,
              tt_prem_silver, tt_prem_gold, tt_airport_taxi, tt_tnvs_hatch, tt_tnvs_sedan,
              tt_tnvs_auv, tt_tnvs_prem],
        '2016-12-01', NULL, true, 'verified', src_ra10754
    ) ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        percentage = EXCLUDED.percentage,
        eligibility = EXCLUDED.eligibility,
        required_documents = EXCLUDED.required_documents,
        citizenship_restrictions = EXCLUDED.citizenship_restrictions,
        legal_basis = EXCLUDED.legal_basis,
        applicable_transports = EXCLUDED.applicable_transports,
        effective_from = EXCLUDED.effective_from,
        effective_until = EXCLUDED.effective_until,
        active = EXCLUDED.active,
        verification_status = EXCLUDED.verification_status,
        source_id = EXCLUDED.source_id;

    -- ============================================================
    -- TEMPORARY RAIL PROMOTIONS (Time-Limited, Not Stackable)
    -- ============================================================
    -- MRT-3 / LRT-2 50% Promo (DOTr/LRTA) - effective 23 Mar 2026 until further notice
    -- This is a general promotional discount for ALL passengers, not a statutory concession

    INSERT INTO discount_types (
        name, description, percentage, eligibility, required_documents,
        citizenship_restrictions, legal_basis, applicable_transports,
        effective_from, effective_until, active, verification_status, source_id
    ) VALUES (
        'MRT-3 / LRT-2 50% Promotional Fare',
        '50% promotional fare discount for ALL passengers on MRT-3 and LRT-2 lines. Not stackable with statutory 20% discounts (Student/Senior/PWD). Temporary promotion effective until further notice.',
        50.00,
        'All passengers regardless of age, citizenship, or status. No ID required beyond standard ticketing. Cannot be combined with Student, Senior, or PWD 20% discounts for the same trip.',
        'Standard ticket or stored value card. No additional ID required.',
        NULL,
        'DOTr Memorandum / LRTA Citizens Charter 2026 (2nd Ed) Annex A / DOTr MRT-3 Citizens Charter 2026 (1st Ed)',
        ARRAY[tt_mrt3, tt_lrt2],
        '2026-03-23', NULL, true, 'verified', src_rail_promo
    ) ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        percentage = EXCLUDED.percentage,
        eligibility = EXCLUDED.eligibility,
        required_documents = EXCLUDED.required_documents,
        citizenship_restrictions = EXCLUDED.citizenship_restrictions,
        legal_basis = EXCLUDED.legal_basis,
        applicable_transports = EXCLUDED.applicable_transports,
        effective_from = EXCLUDED.effective_from,
        effective_until = EXCLUDED.effective_until,
        active = EXCLUDED.active,
        verification_status = EXCLUDED.verification_status,
        source_id = EXCLUDED.source_id;

    -- Note: LRT-1 was NOT part of the 50% rail promotion [08]
    -- LRT-1 uses separate operator tariff (LRMC) effective April 2, 2025

END $$;

-- ============================================================
-- VALIDATION QUERIES
-- ============================================================
-- SELECT name, percentage, legal_basis, active, verification_status, effective_from, effective_until
-- FROM discount_types ORDER BY name;

-- Check statutory vs promotional:
-- SELECT name, percentage,
--   CASE WHEN legal_basis LIKE 'Republic Act%' THEN 'STATUTORY'
--        WHEN legal_basis LIKE '%Promotional%' THEN 'PROMOTIONAL'
--        ELSE 'OTHER' END as category,
--   applicable_transports
-- FROM discount_types;

-- Verify no stacking possibility flagged in description