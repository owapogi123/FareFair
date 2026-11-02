-- ============================================================================
-- FAREFAIR V1.4 | SECURITY INTEGRATION TESTS (pgTAP) – FINAL REPAIR
-- Target: Isolated local Supabase database
-- Run Order: AFTER migration 20261029135200_security_hardening.sql
-- Purpose: Verify RLS policies, grants, trigger, and server‑mediated evidence flow
-- Run with: psql -d postgres -f supabase/tests/security_integration_tests.sql
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

-- Total TAP results (assertions + explicit skips) = 94
SELECT plan(94);

-- ---------------------------------------------------------------------------
-- Helper: execute a DML under a given role/JWT and expect 42501
-- Usage: SELECT throws_ok($sql$, '42501', NULL, $desc$);
-- The $sql$ must contain ONLY a single DML statement.
-- Role and JWT are set in the surrounding SAVEPOINT context.
-- ---------------------------------------------------------------------------

-- ============================================================================
-- TEST 1: REGRESSION – ANONYMOUS READ ACCESS TO REFERENCE DATA (8)
-- ============================================================================

-- Run the anonymous read checks as the anon role with JWT context
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.transport_types WHERE active = true',
    'SELECT 27::bigint',
    'TEST 1.1: Anon can read 27 active transport_types'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.locations WHERE active = true AND city = ''Manila''',
    'SELECT 5::bigint',
    'TEST 1.2: Anon can read 5 active Manila locations'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.sources',
    'SELECT 18::bigint',
    'TEST 1.3: Anon can read all 18 sources'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.discount_types WHERE active = true',
    'SELECT 4::bigint',
    'TEST 1.4: Anon can read 4 active discount_types'
);

-- Restore admin role for policy‑existence checks
RESET ROLE;

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transport_types' AND policyname='Allow public read of active transport_types'),
    'TEST 1.5: transport_types active‑only policy preserved'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='locations' AND policyname='Allow public read of active locations'),
    'TEST 1.6: locations active‑only policy preserved'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discount_types' AND policyname='Allow public read of active discount_types'),
    'TEST 1.7: discount_types active‑only policy preserved'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sources' AND policyname='Allow public read of sources'),
    'TEST 1.8: sources public read policy preserved'
);

-- ============================================================================
-- TEST 2: ANONYMOUS SELECT DENIED FOR SENSITIVE DATA (7)
-- ============================================================================

-- Run the anonymous denial checks as the anon role with JWT context
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.fare_rules',
    'SELECT 0::bigint',
    'TEST 2.1: Anon sees 0 fare_rules (all 9 are check_source)'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.fare_matrices',
    'SELECT 0::bigint',
    'TEST 2.2: Anon sees 0 fare_matrices (migration 07 excluded)'
);

SELECT results_eq(
    $$SELECT count(*)::bigint FROM public.tourism_prices
      WHERE verification_status = 'verified'
        AND source_id IS NOT NULL
        AND price_type IN ('official','establishment_published')$$,
    'SELECT 4::bigint',
    'TEST 2.3: Anon sees 4 verified official/published tourism prices'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.tourism_prices WHERE verification_status = ''conflicting_data''',
    'SELECT 0::bigint',
    'TEST 2.4: Anon sees 0 conflicting_data tourism prices'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.routes WHERE verification_status = ''verified''',
    'SELECT 0::bigint',
    'TEST 2.5: Anon sees 0 verified routes (migration 07 excluded)'
);

-- Restore admin role for policy‑existence checks
RESET ROLE;

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fare_rules' AND policyname='fare_rules_public_verified_in_date'),
    'TEST 2.6: fare_rules anon verified in‑date policy exists'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tourism_prices' AND policyname='tourism_prices_public_verified_official'),
    'TEST 2.7: tourism_prices anon verified official policy exists'
);

-- ============================================================================
-- TEST 3: VERIFIED DATA VISIBILITY LOGIC (5)
-- Admin creates fixtures (no role change), anon reads via policy
-- ============================================================================

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.fare_rules WHERE verification_status = ''check_source''',
    'SELECT 9::bigint',
    'TEST 3.1: All 9 fare_rules have check_source status'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.fare_rules WHERE verification_status = ''verified''',
    'SELECT 0::bigint',
    'TEST 3.2: Zero verified fare_rules currently exist'
);

-- 3.3 verified fare rule visible to anon (admin creates, anon reads)
-- 3.4 expired fare rule hidden from anon
-- 3.5 verified without source_id hidden
-- Fixtures created as admin, tested as anon, cleaned up explicitly (no savepoint rollback of pgTAP state)

-- Admin creates all three fixtures and verifies insertion
WITH ins_3_3 AS (
    INSERT INTO public.fare_rules (transport_type_id, base_fare, included_distance_km, additional_rate_per_km,
                                   effective_from, verification_status, source_id)
    SELECT id, 15.00, 4.00, 2.00, CURRENT_DATE, 'verified',
           (SELECT id FROM public.sources WHERE verification_status = 'verified' LIMIT 1)
    FROM public.transport_types
    WHERE name = 'Traditional Jeepney'
    LIMIT 1
    RETURNING id
),
ins_3_4 AS (
    INSERT INTO public.fare_rules (transport_type_id, base_fare, included_distance_km, additional_rate_per_km,
                                   effective_from, effective_until, verification_status, source_id)
    SELECT id, 20.00, 4.00, 2.50, '2020-01-01', '2020-12-31', 'verified',
           (SELECT id FROM public.sources WHERE verification_status = 'verified' LIMIT 1)
    FROM public.transport_types
    WHERE name = 'Modern Jeepney'
    LIMIT 1
    RETURNING id
),
ins_3_5 AS (
    INSERT INTO public.fare_rules (transport_type_id, base_fare, included_distance_km, additional_rate_per_km,
                                   effective_from, verification_status, source_id)
    SELECT id, 50.00, 4.00, 5.00, CURRENT_DATE, 'verified', NULL
    FROM public.transport_types
    WHERE name = 'Regular Taxi'
    LIMIT 1
    RETURNING id
)
SELECT ok(
    EXISTS (SELECT 1 FROM ins_3_3)
    AND EXISTS (SELECT 1 FROM ins_3_4)
    AND EXISTS (SELECT 1 FROM ins_3_5),
    'TEST 3.3-3.5: All three fixtures created successfully'
);

-- Test 3.3: verified in-date sourced rule visible to anon
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT ok(
    EXISTS (
        SELECT 1 FROM public.fare_rules
        WHERE transport_type_id = (SELECT id FROM public.transport_types WHERE name = 'Traditional Jeepney' LIMIT 1)
          AND base_fare = 15.00
    ),
    'TEST 3.3: Verified fare rule visible to anon'
);

-- Test 3.4: expired rule invisible to anon
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM public.fare_rules
        WHERE transport_type_id = (SELECT id FROM public.transport_types WHERE name = 'Modern Jeepney' LIMIT 1)
          AND base_fare = 20.00
    ),
    'TEST 3.4: Expired fare rule hidden from anon'
);

-- Test 3.5: source-less rule invisible to anon
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM public.fare_rules
        WHERE transport_type_id = (SELECT id FROM public.transport_types WHERE name = 'Regular Taxi' LIMIT 1)
          AND base_fare = 50.00
    ),
    'TEST 3.5: Verified fare rule without source_id hidden from anon'
);

-- Restore admin role and clean up fixtures explicitly
RESET ROLE;
DELETE FROM public.fare_rules
WHERE (transport_type_id = (SELECT id FROM public.transport_types WHERE name = 'Traditional Jeepney' LIMIT 1)
       AND base_fare = 15.00)
   OR (transport_type_id = (SELECT id FROM public.transport_types WHERE name = 'Modern Jeepney' LIMIT 1)
       AND base_fare = 20.00)
   OR (transport_type_id = (SELECT id FROM public.transport_types WHERE name = 'Regular Taxi' LIMIT 1)
       AND base_fare = 50.00);

-- ============================================================================
-- TEST 4: CONFLICTING TOURISM PRICES (3)
-- ============================================================================

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.tourism_prices WHERE verification_status = ''conflicting_data''',
    'SELECT 2::bigint',
    'TEST 4.1: Exactly 2 conflicting_data tourism prices exist'
);

SELECT results_eq(
    $$SELECT establishment_name FROM public.tourism_prices
      WHERE verification_status = 'conflicting_data'
      ORDER BY establishment_name$$,
    $$SELECT unnest(ARRAY['Museo de Intramuros','Museo de Intramuros']) AS establishment_name$$,
    'TEST 4.2: Conflicting records are Museo de Intramuros'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tourism_prices' AND policyname='tourism_prices_staff_all'),
    'TEST 4.3: Staff policy exists for tourism_prices'
);

-- ============================================================================
-- TEST 5: DENY‑BY‑DEFAULT DML BLOCKED (10) – using throws_ok
-- throws_ok runs the SQL in its own subtransaction; no outer savepoint needed.
-- ============================================================================

-- 5.1 Anon INSERT fare_rules blocked
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.fare_rules (transport_type_id, base_fare, included_distance_km, additional_rate_per_km, effective_from)
     VALUES ((SELECT id FROM public.transport_types LIMIT 1), 99.99, 4, 5, CURRENT_DATE);$$,
    '42501', NULL,
    'TEST 5.1: Anon INSERT fare_rules blocked'
);
RESET ROLE;

-- 5.2 Anon UPDATE fare_rules blocked
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$UPDATE public.fare_rules SET base_fare = 999.99 WHERE id = (SELECT id FROM public.fare_rules LIMIT 1);$$,
    '42501', NULL,
    'TEST 5.2: Anon UPDATE fare_rules blocked'
);
RESET ROLE;

-- 5.3 Anon DELETE fare_rules blocked
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$DELETE FROM public.fare_rules WHERE id = (SELECT id FROM public.fare_rules LIMIT 1);$$,
    '42501', NULL,
    'TEST 5.3: Anon DELETE fare_rules blocked'
);
RESET ROLE;

-- 5.4 Anon INSERT tourism_prices blocked
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.tourism_prices (category, establishment_name, item_name, price, price_type, verification_status)
     VALUES ('Test','Fake Place','Fake Item',100,'official','verified');$$,
    '42501', NULL,
    'TEST 5.4: Anon INSERT tourism_prices blocked'
);
RESET ROLE;

-- 5.5 Anon UPDATE overcharge_reports blocked
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$UPDATE public.overcharge_reports SET status = 'resolved' WHERE id = (SELECT id FROM public.overcharge_reports LIMIT 1);$$,
    '42501', NULL,
    'TEST 5.5: Anon UPDATE overcharge_reports blocked'
);
RESET ROLE;

-- 5.6 Anon DELETE overcharge_reports blocked
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$DELETE FROM public.overcharge_reports WHERE id = (SELECT id FROM public.overcharge_reports LIMIT 1);$$,
    '42501', NULL,
    'TEST 5.6: Anon DELETE overcharge_reports blocked'
);
RESET ROLE;

-- 5.7 Anon INSERT evidence_files blocked
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.evidence_files (report_id, storage_path, file_name)
     VALUES ('00000000-0000-0000-0000-000000000000','evidence/test.jpg','test.jpg');$$,
    '42501', NULL,
    'TEST 5.7: Anon INSERT evidence_files blocked'
);
RESET ROLE;

-- 5.8 Auth INSERT fare_rules blocked
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}';
SELECT throws_ok(
    $$INSERT INTO public.fare_rules (transport_type_id, base_fare, included_distance_km, additional_rate_per_km, effective_from)
     VALUES ((SELECT id FROM public.transport_types LIMIT 1), 99.99, 4, 5, CURRENT_DATE);$$,
    '42501', NULL,
    'TEST 5.8: Auth INSERT fare_rules blocked'
);
RESET ROLE;

-- 5.9 Auth UPDATE fare_rules blocked
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}';
SELECT throws_ok(
    $$UPDATE public.fare_rules SET base_fare = 999.99 WHERE id = (SELECT id FROM public.fare_rules LIMIT 1);$$,
    '42501', NULL,
    'TEST 5.9: Auth UPDATE fare_rules blocked'
);
RESET ROLE;

-- 5.10 Auth DELETE fare_rules blocked
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}';
SELECT throws_ok(
    $$DELETE FROM public.fare_rules WHERE id = (SELECT id FROM public.fare_rules LIMIT 1);$$,
    '42501', NULL,
    'TEST 5.10: Auth DELETE fare_rules blocked'
);
RESET ROLE;

-- ============================================================================
-- TEST 6: REPORT SUBMISSION & OWNERSHIP (14 assertions)
-- ============================================================================

-- 6.1 anon insert succeeds (trigger fills server columns); verify via lives_ok
-- lives_ok runs the SQL in a subtransaction and rolls it back automatically.
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT lives_ok(
    $$INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, notes)
     SELECT id, 50.00, now(), 'test_marker_6_1'
     FROM public.transport_types
     ORDER BY id
     LIMIT 1;$$,
    'TEST 6.1: Anon INSERT report succeeds (allowed columns only)'
);
RESET ROLE;

-- 6.2 anon cannot supply user_id (column‑level grant)
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, user_id)
     VALUES ((SELECT id FROM public.transport_types ORDER BY id LIMIT 1), 50.00, now(), gen_random_uuid());$$,
    '42501', NULL,
    'TEST 6.2: Anon cannot set user_id (column grant)'
);
RESET ROLE;

-- 6.3 anon cannot supply status != pending
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, status)
     VALUES ((SELECT id FROM public.transport_types ORDER BY id LIMIT 1), 50.00, now(), 'resolved');$$,
    '42501', NULL,
    'TEST 6.3: Anon cannot set status!=pending (column grant)'
);
RESET ROLE;

-- 6.4 authenticated insert policy exists
SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='overcharge_reports' AND policyname='overcharge_reports_authenticated_insert'),
    'TEST 6.4: Authenticated insert policy exists'
);

-- 6.5 authenticated read own reports policy exists
SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='overcharge_reports' AND policyname='overcharge_reports_auth_read_own'),
    'TEST 6.5: Authenticated read own reports policy exists'
);

-- 6.6 anon has no SELECT policy on overcharge_reports
SELECT results_eq(
    $$SELECT count(*) FROM pg_policies
      WHERE schemaname='public' AND tablename='overcharge_reports'
        AND policyname LIKE '%anon%' AND cmd='SELECT'$$,
    'SELECT 0::bigint',
    'TEST 6.6: Anon has no SELECT policy on overcharge_reports'
);

-- 6.7 authenticated cannot UPDATE protected columns
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}';
SELECT throws_ok(
    $$UPDATE public.overcharge_reports SET status = 'resolved' WHERE id = (SELECT id FROM public.overcharge_reports ORDER BY id LIMIT 1);$$,
    '42501', NULL,
    'TEST 6.7: Auth cannot UPDATE status (column grant)'
);
RESET ROLE;

-- 6.8 staff policy exists
SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='overcharge_reports' AND policyname='overcharge_reports_staff_all'),
    'TEST 6.8: Staff policy exists for overcharge_reports'
);

-- 6.9 trigger function exists
SELECT ok(
    EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='set_overcharge_report_server_fields'),
    'TEST 6.9: Trigger function set_overcharge_report_server_fields exists'
);

-- 6.10 authenticated user_id equals auth.uid() (auth can read own report via policy)
-- 6.11 authenticated submitted_by_anon = false
-- Fixtures created as authenticated, verified via RLS, cleaned up explicitly (no savepoint rollback of pgTAP state)

-- Test 6.10: authenticated report user_id matches auth.uid()
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}';
INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, notes)
SELECT id, 60.00, now(), 'test_marker_6_10'
FROM public.transport_types
ORDER BY id
LIMIT 1;
SELECT ok(
    EXISTS (SELECT 1 FROM public.overcharge_reports WHERE notes = 'test_marker_6_10'),
    'TEST 6.10: Fixture created successfully'
);
SELECT is(
    (SELECT user_id FROM public.overcharge_reports WHERE notes = 'test_marker_6_10'),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'TEST 6.10: Authenticated report user_id matches auth.uid()'
);

-- Test 6.11: authenticated submitted_by_anon = false
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}';
INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, notes)
SELECT id, 70.00, now(), 'test_marker_6_11'
FROM public.transport_types
ORDER BY id
LIMIT 1;
SELECT ok(
    EXISTS (SELECT 1 FROM public.overcharge_reports WHERE notes = 'test_marker_6_11'),
    'TEST 6.11: Fixture created successfully'
);
SELECT ok(
    NOT (SELECT submitted_by_anon FROM public.overcharge_reports WHERE notes = 'test_marker_6_11'),
    'TEST 6.11: Authenticated report submitted_by_anon = false'
);

-- Restore admin role and clean up both fixtures explicitly
RESET ROLE;
DELETE FROM public.overcharge_reports
WHERE notes IN ('test_marker_6_10', 'test_marker_6_11');

-- 6.12 authenticated cannot set submitter_ip_hash
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"33333333-3333-3333-3333-333333333333"}';
SELECT throws_ok(
    $$INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, submitter_ip_hash)
     VALUES ((SELECT id FROM public.transport_types ORDER BY id LIMIT 1), 80.00, now(), 'hash');$$,
    '42501', NULL,
    'TEST 6.12: Authenticated cannot set submitter_ip_hash'
);
RESET ROLE;

-- 6.13 anon cannot set submitted_by_anon
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, submitted_by_anon)
     VALUES ((SELECT id FROM public.transport_types ORDER BY id LIMIT 1), 50.00, now(), false);$$,
    '42501', NULL,
    'TEST 6.13: Anon cannot set submitted_by_anon (column grant)'
);
RESET ROLE;

-- 6.14 anon cannot set created_at
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, created_at)
     VALUES ((SELECT id FROM public.transport_types ORDER BY id LIMIT 1), 50.00, now(), now());$$,
    '42501', NULL,
    'TEST 6.14: Anon cannot set created_at (column grant)'
);
RESET ROLE;

-- ============================================================================
-- TEST 7: EVIDENCE FILES – SERVER‑MEDIATED (5)
-- ============================================================================

-- 7.1 Anon INSERT evidence_files blocked
-- throws_ok runs the SQL in a subtransaction; no outer savepoint needed.
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT throws_ok(
    $$INSERT INTO public.evidence_files (report_id, storage_path, file_name)
     VALUES ('00000000-0000-0000-0000-000000000000','evidence/test.jpg','test.jpg');$$,
    '42501', NULL,
    'TEST 7.1: Anon INSERT evidence_files blocked'
);
RESET ROLE;

-- 7.2 Auth INSERT evidence_files blocked
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}';
SELECT throws_ok(
    $$INSERT INTO public.evidence_files (report_id, storage_path, file_name)
     VALUES ('00000000-0000-0000-0000-000000000000','evidence/test.jpg','test.jpg');$$,
    '42501', NULL,
    'TEST 7.2: Auth INSERT evidence_files blocked'
);
RESET ROLE;

SELECT ok(
    has_table_privilege('service_role', 'public.evidence_files', 'INSERT'),
    'TEST 7.3: Service role can INSERT evidence_files'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='evidence_files' AND policyname='evidence_files_staff_select'),
    'TEST 7.4: Staff SELECT evidence policy exists'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='evidence_files' AND policyname='evidence_files_auth_read_own'),
    'TEST 7.5: Auth read own evidence policy exists'
);

-- ============================================================================
-- TEST 8: RECORD PRESERVATION (8)
-- ============================================================================

SELECT results_eq('SELECT count(*)::bigint FROM public.sources', 'SELECT 18::bigint',
    'TEST 8.1: sources count preserved (18)');
SELECT results_eq('SELECT count(*)::bigint FROM public.transport_types WHERE active = true', 'SELECT 27::bigint',
    'TEST 8.2: transport_types active count preserved (27)');
SELECT results_eq('SELECT count(*)::bigint FROM public.fare_rules', 'SELECT 9::bigint',
    'TEST 8.3: fare_rules count preserved (9)');
SELECT results_eq('SELECT count(*)::bigint FROM public.discount_types WHERE active = true', 'SELECT 4::bigint',
    'TEST 8.4: discount_types active count preserved (4)');
SELECT results_eq('SELECT count(*)::bigint FROM public.locations WHERE active = true AND city = ''Manila''', 'SELECT 5::bigint',
    'TEST 8.5: locations active Manila tourism count preserved (5)');
SELECT results_eq('SELECT count(*)::bigint FROM public.tourism_prices', 'SELECT 6::bigint',
    'TEST 8.6: tourism_prices count preserved (6)');
SELECT results_eq('SELECT count(*)::bigint FROM public.routes', 'SELECT 0::bigint',
    'TEST 8.7: routes count (0, migration 07 excluded)');
SELECT results_eq('SELECT count(*)::bigint FROM public.fare_matrices', 'SELECT 0::bigint',
    'TEST 8.8: fare_matrices count (0, migration 07 excluded)');

-- ============================================================================
-- TEST 9: SOURCE TRACEABILITY (4)
-- ============================================================================

SELECT results_eq(
    $$SELECT count(*)::bigint FROM public.fare_rules
      WHERE verification_status = 'verified'
        AND effective_from <= CURRENT_DATE
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        AND source_id IS NULL$$,
    'SELECT 0::bigint',
    'TEST 9.1: No public fare_rules without source_id'
);

SELECT results_eq(
    $$SELECT count(*)::bigint FROM public.tourism_prices
      WHERE verification_status = 'verified'
        AND price_type IN ('official','establishment_published')
        AND source_id IS NULL$$,
    'SELECT 0::bigint',
    'TEST 9.2: No public tourism_prices without source_id'
);

SELECT results_eq(
    $$SELECT count(*)::bigint FROM public.fare_matrices
      WHERE verification_status = 'verified'
        AND effective_from <= CURRENT_DATE
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        AND source_id IS NULL$$,
    'SELECT 0::bigint',
    'TEST 9.3: No public fare_matrices without source_id'
);

SELECT results_eq(
    'SELECT count(*)::bigint FROM public.discount_types WHERE active = true AND source_id IS NULL',
    'SELECT 0::bigint',
    'TEST 9.4: No active discount_types without source_id'
);

-- ============================================================================
-- TEST 10: IDEMPOTENCY (2)
-- ============================================================================

SELECT skip('TEST 10.1: Migration idempotency – manual rerun not performed');
SELECT results_eq(
    $$SELECT count(*) FROM pg_policies
      WHERE schemaname='public'
        AND tablename IN ('fare_rules','fare_matrices','tourism_prices','sources','routes',
                          'overcharge_reports','evidence_files','transport_types','locations','discount_types')$$,
    $$SELECT 28::bigint$$,
    'TEST 10.2: Policy count stable (28 policies expected)'
);

-- ============================================================================
-- TEST 11: LEAST‑PRIVILEGE GRANTS (7) – column‑level checks
-- ============================================================================

SELECT ok(
    has_table_privilege('anon','public.transport_types','SELECT'),
    'TEST 11.1: Anon has SELECT on transport_types');
SELECT ok(
    has_table_privilege('anon','public.locations','SELECT'),
    'TEST 11.2: Anon has SELECT on locations');
SELECT ok(
    has_table_privilege('anon','public.sources','SELECT'),
    'TEST 11.3: Anon has SELECT on sources');
SELECT ok(
    has_table_privilege('anon','public.discount_types','SELECT'),
    'TEST 11.4: Anon has SELECT on discount_types');

-- 11.5 column‑level INSERT grant on overcharge_reports (allowed columns)
SELECT ok(
    has_column_privilege('anon','public.overcharge_reports','transport_type_id','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','charged_fare','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','occurred_at','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','origin_text','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','destination_text','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','expected_fare','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','difference','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','vehicle_plate','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','operator','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','driver_details','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','notes','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','origin_location_id','INSERT')
    AND has_column_privilege('anon','public.overcharge_reports','destination_location_id','INSERT'),
    'TEST 11.5: Anon has INSERT on allowed columns of overcharge_reports'
);

-- 11.6 protected columns must NOT be insertable by anon
SELECT ok(
    NOT has_column_privilege('anon','public.overcharge_reports','user_id','INSERT')
    AND NOT has_column_privilege('anon','public.overcharge_reports','submitted_by_anon','INSERT')
    AND NOT has_column_privilege('anon','public.overcharge_reports','status','INSERT')
    AND NOT has_column_privilege('anon','public.overcharge_reports','submitter_ip_hash','INSERT')
    AND NOT has_column_privilege('anon','public.overcharge_reports','created_at','INSERT'),
    'TEST 11.6: Anon lacks INSERT on protected columns of overcharge_reports'
);

-- 11.7 anon lacks INSERT on evidence_files (table‑level)
SELECT ok(
    NOT has_table_privilege('anon','public.evidence_files','INSERT'),
    'TEST 11.7: Anon lacks INSERT on evidence_files'
);

-- ============================================================================
-- TEST 12: POLICY BYPASS VECTORS (3)
-- ============================================================================

SELECT results_eq(
    $$SELECT count(*) FROM pg_views
      WHERE schemaname='public'
        AND (definition LIKE '%fare_rules%' OR definition LIKE '%tourism_prices%')
        AND definition NOT LIKE '%security_invoker%'$$,
    'SELECT 0::bigint',
    'TEST 12.1: No views bypassing RLS on sensitive tables'
);

SELECT results_eq(
    $$SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.prosecdef = true$$,
    'SELECT 1::bigint',
    'TEST 12.2: Only the trigger function is SECURITY DEFINER in public schema'
);

SELECT results_eq(
    $$SELECT count(*) FROM pg_tables
      WHERE schemaname='public'
        AND tablename IN ('fare_rules','fare_matrices','tourism_prices','sources','routes',
                          'overcharge_reports','evidence_files','transport_types','locations','discount_types')
        AND rowsecurity = true$$,
    'SELECT 10::bigint',
    'TEST 12.3: RLS enabled on all 10 tables'
);

-- ============================================================================
-- TEST 13: APPLICATION QUERY COMPATIBILITY (3)
-- ============================================================================

-- 13.1 Verify anon cannot see a check_source fare rule
-- Admin: pick an existing check_source fare rule and confirm it exists
SELECT ok(
    EXISTS (
        SELECT 1 FROM public.fare_rules
        WHERE verification_status = 'check_source'
        LIMIT 1
    ),
    'TEST 13.1: Baseline check_source fare rule exists'
);

-- Capture the check_source fare rule UUID under admin context into a temp table
CREATE TEMP TABLE tmp_check_source_rule_id (id uuid) ON COMMIT DROP;
-- Grant SELECT to anon so it can read the captured UUID after SET ROLE anon
GRANT SELECT ON tmp_check_source_rule_id TO anon;
INSERT INTO tmp_check_source_rule_id (id)
SELECT id FROM public.fare_rules
WHERE verification_status = 'check_source'
ORDER BY id LIMIT 1;

-- Verify the baseline row exists (fail test if not)
SELECT ok(
    EXISTS (SELECT 1 FROM tmp_check_source_rule_id),
    'TEST 13.2: Setup - check_source fare rule UUID captured'
);

-- Anon: query that same rule by its stored UUID only; RLS should hide it
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM public.fare_rules
        WHERE id = (SELECT id FROM tmp_check_source_rule_id)
    ),
    'TEST 13.2: fetchFareRuleForTransport returns null for check_source fares'
);
RESET ROLE;

-- Run the tourism prices visibility check as anon
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role":"anon"}';
SELECT results_eq(
    'SELECT count(*)::bigint FROM public.tourism_prices',
    'SELECT 4::bigint',
    'TEST 13.3: fetchTourismPrices returns 4 verified official/published prices'
);
RESET ROLE;

-- TEST 13.4: Column-level INSERT privilege check for anon on overcharge_reports
-- Migration 08 grants INSERT on specific columns only (server-controlled fields excluded)
SELECT ok(
    has_column_privilege('anon', 'public.overcharge_reports', 'transport_type_id', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'origin_location_id', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'destination_location_id', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'origin_text', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'destination_text', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'expected_fare', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'charged_fare', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'difference', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'vehicle_plate', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'operator', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'driver_details', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'notes', 'INSERT')
    AND has_column_privilege('anon', 'public.overcharge_reports', 'occurred_at', 'INSERT'),
    'TEST 13.4: Anon has column-level INSERT on overcharge_reports (client-settable fields only)'
);

-- ============================================================================
-- TEST 14: STAFF AUTHORIZATION – behavioural checks
-- ============================================================================

-- Create test fixtures: two reports owned by different users, and evidence for the second report
-- Use temp tables with ON COMMIT DROP to capture UUIDs for deterministic cleanup
CREATE TEMP TABLE tmp_report_a_id (id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_report_b_id (id uuid) ON COMMIT DROP;
-- Grant INSERT (for CTE capture) and SELECT (for Test 14.2 reads) to authenticated
-- Staff uses authenticated role with app_metadata, so authenticated grants cover both
GRANT INSERT, SELECT ON tmp_report_a_id TO authenticated;
GRANT INSERT, SELECT ON tmp_report_b_id TO authenticated;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
WITH ins AS (
    INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, notes)
    SELECT id, 10.00, now(), 'staff_test_report_A'
    FROM public.transport_types ORDER BY id LIMIT 1
    RETURNING id
)
INSERT INTO tmp_report_a_id SELECT id FROM ins;
RESET ROLE;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';
WITH ins AS (
    INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, notes)
    SELECT id, 20.00, now(), 'staff_test_report_B'
    FROM public.transport_types ORDER BY id LIMIT 1
    RETURNING id
)
INSERT INTO tmp_report_b_id SELECT id FROM ins;
RESET ROLE;

SET LOCAL ROLE service_role;
SET LOCAL "request.jwt.claims" = '{"role":"service_role"}';
INSERT INTO public.evidence_files (report_id, storage_path, file_name)
SELECT id, 'evidence/test.jpg', 'test.jpg'
FROM public.overcharge_reports WHERE notes = 'staff_test_report_B';
RESET ROLE;

-- Verify fixtures were created and UUIDs captured
SELECT ok(
    EXISTS (SELECT 1 FROM tmp_report_a_id)
    AND EXISTS (SELECT 1 FROM tmp_report_b_id),
    'TEST 14: Setup - Report A and B UUIDs captured'
);

-- Verify all fixtures were created
SELECT ok(
    EXISTS (SELECT 1 FROM public.overcharge_reports WHERE notes = 'staff_test_report_A')
    AND EXISTS (SELECT 1 FROM public.overcharge_reports WHERE notes = 'staff_test_report_B')
    AND EXISTS (
        SELECT 1 FROM public.evidence_files
        WHERE report_id = (SELECT id FROM tmp_report_b_id)
    ),
    'TEST 14: Staff test fixtures created'
);

-- 14.1 Regular user cannot read another user's report; staff can
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
SELECT ok(
    NOT EXISTS (SELECT 1 FROM public.overcharge_reports WHERE notes = 'staff_test_report_B'),
    'TEST 14.1: Regular user cannot read other user report'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","app_metadata":{"staff":true}}';
SELECT ok(
    EXISTS (SELECT 1 FROM public.overcharge_reports WHERE notes = 'staff_test_report_B'),
    'TEST 14.1: Staff can read any report'
);
RESET ROLE;

-- 14.2 Regular user cannot read another user's evidence; staff can
-- Use captured Report B UUID directly (not RLS-filtered subquery)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM public.evidence_files
        WHERE report_id = (SELECT id FROM tmp_report_b_id)
    ),
    'TEST 14.2: Regular user cannot read other user evidence'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"role":"authenticated","sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","app_metadata":{"staff":true}}';
SELECT ok(
    EXISTS (
        SELECT 1 FROM public.evidence_files
        WHERE report_id = (SELECT id FROM tmp_report_b_id)
    ),
    'TEST 14.2: Staff can read any evidence'
);
RESET ROLE;

-- Cleanup temporary fixtures using captured UUIDs
DELETE FROM public.evidence_files
WHERE report_id = (SELECT id FROM tmp_report_b_id);
DELETE FROM public.overcharge_reports
WHERE id IN (SELECT id FROM tmp_report_a_id UNION SELECT id FROM tmp_report_b_id);

-- ============================================================================
-- TEST 15: PENDING INTEGRATION TESTS (4 skips)
-- ============================================================================

SELECT skip('TEST 15.1: Guest evidence upload flow – Edge Function and private Storage bucket not yet deployed');
SELECT skip('TEST 15.2: Anonymous report evidence access via one‑time token – token issuance workflow not yet implemented');
SELECT skip('TEST 15.3: Rate limiting via submitter_ip_hash – Edge Function rate‑limit logic not yet implemented');
SELECT skip('TEST 15.4: Migration idempotency manual verification');

-- ============================================================================
-- FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;