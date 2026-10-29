-- Migration: 20261028_01_sources
-- Description: Insert verified source records from Fare Transparency Research (28 Oct 2026)
-- Author: Farefair V1.4 Data Integration
-- Dependencies: sources table must exist
-- Run Order: 1 (must run before fare_rules, discount_types, tourism_prices)
-- CRITICAL FIX: Added UNIQUE constraint on (organization, title, url) for idempotency.
--              ON CONFLICT DO UPDATE preserves existing UUIDs for FK integrity.

-- ============================================================
-- ENSURE IDEMPOTENCY: UNIQUE CONSTRAINT ON BUSINESS KEY
-- ============================================================
-- This constraint must exist before the INSERT to make ON CONFLICT work.
-- It is safe to add because: (1) organization, title, url are NOT NULL in practice,
-- (2) no legitimate duplicate source records should share all three fields.
-- If the constraint already exists (e.g., from a prior fixed run), this is a no-op.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sources_org_title_url_key'
    ) THEN
        ALTER TABLE sources
        ADD CONSTRAINT sources_org_title_url_key UNIQUE (organization, title, url);
    END IF;
END $$;

-- ============================================================
-- SOURCES
-- ============================================================
-- Each source gets a deterministic UUID on first insert.
-- ON CONFLICT DO UPDATE preserves the original UUID (critical for FK references
-- from fare_rules, discount_types, tourism_prices, fare_matrices).
-- verification_status: 'verified' = cross-checked, 'conflicting_data' = known discrepancy
-- source_type enum: government_document, official_website, news_article, press_release, regulatory_order, law, other

INSERT INTO sources (organization, title, url, source_type, publication_date, effective_date, checked_at, information_supported, verification_status)
VALUES
-- [01] PTV News - LTFRB fare guides (primary fare source)
(
  'Philippine Television News (PTV)',
  'LTFRB Releases New Matrices for PUV Fare Hikes Effective Sept 28',
  'https://ptvnews.ph/ltfrb-releases-new-matrices-for-puv-fare-hikes-effective-sept-28/',
  'government_document',
  '2026-09-28',
  '2026-09-28',
  '2026-10-28 00:00:00+00',
  'Jeepney, bus, EDSA Busway, provincial bus, taxi, TNVS, UV Express minimum fares, additional km rates, concessionary minima, fare hike comparison table',
  'verified'
),
-- [02] PIA / LTFRB - Display requirement & hotline
(
  'Philippine Information Agency / Land Transportation Franchising and Regulatory Board',
  'LTFRB Reminds PUV Operators, Drivers to Display Updated Fare Matrix',
  'https://pia.gov.ph/news/luzon/ncr/ltfrb-reminds-puv-operators-drivers-to-display-updated-fare-matrix',
  'regulatory_order',
  '2026-09-28',
  '2026-09-28',
  '2026-10-28 00:00:00+00',
  'Requirement for operators to display authorized route matrices; LTFRB complaint hotline 1342',
  'verified'
),
-- [03] PCO - Fare adjustment confirmation
(
  'Presidential Communications Office',
  'Palace: Gov''t Balances Transport Support, Commuter Welfare Amid Fare Hike and Rising Fuel Prices',
  'https://pco.gov.ph/news_releases/palace-govt-balances-transport-support-commuter-welfare-amid-fare-hike-and-rising-fuel-prices/',
  'press_release',
  '2026-09-28',
  '2026-09-28',
  '2026-10-28 00:00:00+00',
  'Confirmation of transport fare adjustments and continuing passenger discounts',
  'verified'
),
-- [04] SunStar (PNA-derived) - Corroboration
(
  'SunStar Manila (PNA-derived reporting)',
  'LTFRB Sets New PUV Rates Effective Sept 28',
  'https://www.sunstar.com.ph/manila/ltfrb-sets-new-puv-rates-effective-sept-28',
  'news_article',
  '2026-09-29',
  '2026-09-28',
  '2026-10-28 00:00:00+00',
  'Corroboration of fares and provisional/pending taxi and UV Express cases',
  'verified'
),
-- [05] LRTA - Rail 50% promo
(
  'Light Rail Transit Authority',
  'Tickets and Fares - LRT-2 and MRT-3 50% General Promotional Fare',
  'https://www.lrta.gov.ph/tickets-and-fares/',
  'official_website',
  '2026-03-23',
  '2026-03-23',
  '2026-10-28 00:00:00+00',
  'LRT-2 and MRT-3 50% general promotional fare from March 23, 2026',
  'verified'
),
-- [06] LRTA Citizens Charter 2026 2nd Ed - LRT-2 matrices
(
  'Light Rail Transit Authority',
  '2026 Citizens Charter Handbook, 2nd Edition, Annex A',
  'https://www.lrta.gov.ph/wp-content/uploads/2026/03/Citizens-Charter-Handbook-2026-2nd-Edition.pdf',
  'government_document',
  '2026-03-23',
  '2026-03-23',
  '2026-10-28 00:00:00+00',
  'Official LRT-2 discounted 50% single-journey and stored-value station-pair fare matrices (PDF page 10)',
  'verified'
),
-- [07] DOTr MRT-3 Citizens Charter 2026 - MRT-3 matrices
(
  'Department of Transportation - MRT-3',
  'DOTr MRT-3 2026 Citizens Charter, 1st Edition',
  'https://www.dotrmrt3.gov.ph/dotrmrt3-citizen-charter-handbook-2026-1st-edition.pdf',
  'government_document',
  '2026-03-23',
  '2026-03-23',
  '2026-10-28 00:00:00+00',
  'Official pre-discount and 50%-discount station-to-station fare matrices for MRT-3 (PDF page 93)',
  'verified'
),
-- [08] LRMC LRT-1 - Separate operator tariff
(
  'Light Rail Manila Corporation',
  'New LRT-1 Fares Effective 2 April 2025',
  'https://lrmc.ph/2025/02/18/new-lrt-1-fares-effective-2-april-2025/',
  'official_website',
  '2025-04-02',
  '2025-04-02',
  '2026-10-28 00:00:00+00',
  'LRT-1 approved fare structure effective April 2, 2025 (boarding component P16.25 + distance component P1.47/km)',
  'verified'
),
-- [09] RA 11314 - Student Fare Discount Act
(
  'Lawphil (Official Gazette)',
  'Republic Act No. 11314 - Student Fare Discount Act',
  'https://lawphil.net/statutes/repacts/ra2019/ra_11314_2019.html',
  'law',
  '2019-04-17',
  '2019-04-17',
  '2026-10-28 00:00:00+00',
  'Student 20% fare discount on eligible public transport; Filipino enrolled student; excludes post-graduate; weekends/holidays included; exceptions for contracted tourist/shuttle/school services',
  'verified'
),
-- [10] RA 9994 - Senior Citizens
(
  'Lawphil (Official Gazette)',
  'Republic Act No. 9994 - Expanded Senior Citizens Act of 2010',
  'https://lawphil.net/statutes/repacts/ra2010/ra_9994_2010.html',
  'law',
  '2010-02-15',
  '2010-02-15',
  '2026-10-28 00:00:00+00',
  'Senior citizen 20% discount on covered public transport and qualifying services; statutory resident-citizen/age and ID requirements; no double discount',
  'verified'
),
-- [11] RA 10754 - PWD Benefits
(
  'Lawphil (Official Gazette)',
  'Republic Act No. 10754 - Expanded PWD Benefits Act',
  'https://lawphil.net/statutes/repacts/ra2016/ra_10754_2016.html',
  'law',
  '2016-12-01',
  '2016-12-01',
  '2026-10-28 00:00:00+00',
  'PWD at least 20% discount on covered transport, dining, recreation, admissions; Filipino citizenship; accepted proof; non-stacking restriction',
  'verified'
),
-- [12] Intramuros Administration - Hours & Fees
(
  'Intramuros Administration',
  'Hours and Fees - Fort Santiago, Centro de Turismo',
  'https://intramuros.gov.ph/hours/',
  'official_website',
  NULL,
  NULL,
  '2026-10-28 00:00:00+00',
  'Fort Santiago P75/P50, Centro de Turismo P150/P120; potentially conflicting Museo de Intramuros fee information',
  'verified'
),
-- [13] Intramuros Administration - Casa Manila
(
  'Intramuros Administration',
  'Casa Manila Museum Admission',
  'https://intramuros.gov.ph/cmm/',
  'official_website',
  NULL,
  NULL,
  '2026-10-28 00:00:00+00',
  'Casa Manila museum published admission regular P75 and discounted P50',
  'verified'
),
-- [14] Intramuros Administration - Museum Guide (CONFLICT)
(
  'Intramuros Administration',
  'Museum Guide - Museo de Intramuros',
  'https://intramuros.gov.ph/guide-museums/',
  'official_website',
  NULL,
  NULL,
  '2026-10-28 00:00:00+00',
  'Museo de Intramuros P200 regular / P160 discounted; CONFLICTS with Hours & Fees page (P150/P120)',
  'conflicting_data'
),
-- [15] National Museum - Free Admission
(
  'National Museum of the Philippines',
  'Book a Tour - Free Admission Policy',
  'https://reservation.nationalmuseum.gov.ph/',
  'official_website',
  NULL,
  NULL,
  '2026-10-28 00:00:00+00',
  'Free admission and visit/booking requirements',
  'verified'
),
-- [16] GMA News - Rail Promo Confirmation
(
  'GMA News',
  'DOTr: 50% Discount on Train Rides at MRT-3, LRT-2 Starting March 23',
  'https://www.gmanetwork.com/news/topstories/nation/980582/dotr-50-discount-on-train-rides-at-mrt-3-lrt-2-starting-march-23/story/',
  'news_article',
  '2026-03-23',
  '2026-03-23',
  '2026-10-28 00:00:00+00',
  '50%-off LRT-2/MRT-3 period until further notice; concessionary card overlap guidance',
  'verified'
),
-- [17] LTFRB Official Website - Primary matrix location
(
  'Land Transportation Franchising and Regulatory Board',
  'Official Website - Route-Specific Fare Matrices and Fare Guide Updates',
  'https://ltfrb.gov.ph/',
  'official_website',
  NULL,
  NULL,
  '2026-10-28 00:00:00+00',
  'Primary location for route-specific official fare matrices and fare-guide updates',
  'verified'
),
-- [18] LRMC LRT-1 Fare Matrix
(
  'Light Rail Manila Corporation',
  'LRT-1 Fare Matrix - Station-to-Station Fares',
  'https://lrmc.ph/our-business-featured/fare-matrix/',
  'official_website',
  NULL,
  NULL,
  '2026-10-28 00:00:00+00',
  'Operator-maintained station-to-station fares; chart images require direct visual confirmation for exact station-pair amount',
  'verified'
)
ON CONFLICT (organization, title, url) DO UPDATE SET
    source_type = EXCLUDED.source_type,
    publication_date = EXCLUDED.publication_date,
    effective_date = EXCLUDED.effective_date,
    checked_at = EXCLUDED.checked_at,
    information_supported = EXCLUDED.information_supported,
    verification_status = EXCLUDED.verification_status;

-- ============================================================
-- VALIDATION QUERIES (run after migration to verify)
-- ============================================================
-- SELECT count(*) FROM sources WHERE verification_status = 'verified';     -- should be 17
-- SELECT count(*) FROM sources WHERE verification_status = 'conflicting_data'; -- should be 1
-- SELECT organization, title, verification_status FROM sources ORDER BY checked_at DESC;
-- -- Test idempotency: re-run this migration, then verify row count unchanged and UUIDs stable:
-- -- SELECT id, organization, title FROM sources ORDER BY organization;
-- -- Re-run and confirm same UUIDs returned.