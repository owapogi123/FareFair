-- ============================================================================
-- FAREFAIR V1.4 | MIGRATION | SECURITY HARDENING & RLS POLICY REFINEMENT
-- Prepared: 2026-10-29
-- Dependencies: Migrations 01-06 applied; Migration 07 EXCLUDED
-- Purpose: Restrict public access to verified+source-linked+within-date data only
--          Secure report submission and evidence upload
--          Apply least-privilege grants
-- Timestamp: 20261029135200 (YYYYMMDDHHmmss)
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';

-- ============================================================================
-- SECTION 1: PRESERVE EXISTING CORRECT POLICIES (TARGETED DROPS ONLY)
-- ============================================================================

-- Drop only the overly-permissive policies we intend to replace.
-- Preserve: "Allow public read of active transport_types"
-- Preserve: "Allow public read of active locations"
-- Preserve: "Allow public read of active discount_types"
-- Preserve: "Allow public read of sources"

DROP POLICY IF EXISTS "Allow public read of fare_rules" ON public.fare_rules;
DROP POLICY IF EXISTS "Allow public read of fare_matrices" ON public.fare_matrices;
DROP POLICY IF EXISTS "Allow public read of tourism_prices" ON public.tourism_prices;
DROP POLICY IF EXISTS "Allow public read of routes" ON public.routes;
DROP POLICY IF EXISTS "Allow public insert of overcharge_reports" ON public.overcharge_reports;
DROP POLICY IF EXISTS "Allow authenticated users to read own reports" ON public.overcharge_reports;
DROP POLICY IF EXISTS "Allow public insert of evidence_files" ON public.evidence_files;

-- Idempotency: drop policies created by this migration so it can be re-run safely
DROP POLICY IF EXISTS "fare_rules_public_verified_in_date" ON public.fare_rules;
DROP POLICY IF EXISTS "fare_rules_authenticated_public" ON public.fare_rules;
DROP POLICY IF EXISTS "fare_rules_staff_all" ON public.fare_rules;
DROP POLICY IF EXISTS "fare_rules_service_all" ON public.fare_rules;

DROP POLICY IF EXISTS "fare_matrices_public_verified_in_date" ON public.fare_matrices;
DROP POLICY IF EXISTS "fare_matrices_authenticated_public" ON public.fare_matrices;
DROP POLICY IF EXISTS "fare_matrices_staff_all" ON public.fare_matrices;
DROP POLICY IF EXISTS "fare_matrices_service_all" ON public.fare_matrices;

DROP POLICY IF EXISTS "tourism_prices_public_verified_official" ON public.tourism_prices;
DROP POLICY IF EXISTS "tourism_prices_authenticated_public" ON public.tourism_prices;
DROP POLICY IF EXISTS "tourism_prices_staff_all" ON public.tourism_prices;
DROP POLICY IF EXISTS "tourism_prices_service_all" ON public.tourism_prices;

DROP POLICY IF EXISTS "routes_public_verified" ON public.routes;
DROP POLICY IF EXISTS "routes_authenticated_public" ON public.routes;
DROP POLICY IF EXISTS "routes_staff_all" ON public.routes;
DROP POLICY IF EXISTS "routes_service_all" ON public.routes;

DROP POLICY IF EXISTS "overcharge_reports_anon_insert" ON public.overcharge_reports;
DROP POLICY IF EXISTS "overcharge_reports_authenticated_insert" ON public.overcharge_reports;
DROP POLICY IF EXISTS "overcharge_reports_auth_read_own" ON public.overcharge_reports;
DROP POLICY IF EXISTS "overcharge_reports_staff_all" ON public.overcharge_reports;
DROP POLICY IF EXISTS "overcharge_reports_auth_update_own_fields" ON public.overcharge_reports;

DROP POLICY IF EXISTS "evidence_files_service_all" ON public.evidence_files;
DROP POLICY IF EXISTS "evidence_files_staff_select" ON public.evidence_files;
DROP POLICY IF EXISTS "evidence_files_auth_read_own" ON public.evidence_files;

-- ============================================================================
-- SECTION 2: FARE RULES — PUBLIC READ ONLY IF VERIFIED + SOURCE-LINKED + IN DATE
-- ============================================================================

-- Public (anon): only verified fare rules with a source, currently effective
CREATE POLICY "fare_rules_public_verified_in_date"
ON public.fare_rules FOR SELECT
TO anon
USING (
    verification_status = 'verified'
    AND source_id IS NOT NULL
    AND effective_from <= CURRENT_DATE
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
);

-- Authenticated users: same public visibility (no elevation)
CREATE POLICY "fare_rules_authenticated_public"
ON public.fare_rules FOR SELECT
TO authenticated
USING (
    verification_status = 'verified'
    AND source_id IS NOT NULL
    AND effective_from <= CURRENT_DATE
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
);

-- Staff (via app_metadata.claims.staff = true): read all fare rules for audit
-- Uses Supabase Auth app_metadata (server-managed, not user-editable user_metadata)
CREATE POLICY "fare_rules_staff_all"
ON public.fare_rules FOR SELECT
TO authenticated
USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff') = 'true'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

-- Service role full access (bypasses RLS via GRANT, but policy explicit)
CREATE POLICY "fare_rules_service_all"
ON public.fare_rules FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SECTION 3: FARE MATRICES — PUBLIC READ ONLY IF VERIFIED + SOURCE-LINKED + IN DATE
-- ============================================================================

CREATE POLICY "fare_matrices_public_verified_in_date"
ON public.fare_matrices FOR SELECT
TO anon
USING (
    verification_status = 'verified'
    AND source_id IS NOT NULL
    AND effective_from <= CURRENT_DATE
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
);

CREATE POLICY "fare_matrices_authenticated_public"
ON public.fare_matrices FOR SELECT
TO authenticated
USING (
    verification_status = 'verified'
    AND source_id IS NOT NULL
    AND effective_from <= CURRENT_DATE
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
);

CREATE POLICY "fare_matrices_staff_all"
ON public.fare_matrices FOR SELECT
TO authenticated
USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff') = 'true'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

CREATE POLICY "fare_matrices_service_all"
ON public.fare_matrices FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SECTION 4: TOURISM PRICES — PUBLIC READ ONLY VERIFIED + SOURCE-LINKED + OFFICIAL/PUBLISHED
-- ============================================================================

-- Public (anon): verified, source-linked, and price_type is official or establishment_published
-- conflicting_data (2 records) are EXCLUDED from public view
CREATE POLICY "tourism_prices_public_verified_official"
ON public.tourism_prices FOR SELECT
TO anon
USING (
    verification_status = 'verified'
    AND source_id IS NOT NULL
    AND price_type IN ('official', 'establishment_published')
);

-- Authenticated users: same public visibility (no elevation)
CREATE POLICY "tourism_prices_authenticated_public"
ON public.tourism_prices FOR SELECT
TO authenticated
USING (
    verification_status = 'verified'
    AND source_id IS NOT NULL
    AND price_type IN ('official', 'establishment_published')
);

-- Staff (via app_metadata.claims.staff = true): see all including conflicting_data for audit
CREATE POLICY "tourism_prices_staff_all"
ON public.tourism_prices FOR SELECT
TO authenticated
USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff') = 'true'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

CREATE POLICY "tourism_prices_service_all"
ON public.tourism_prices FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SECTION 5: SOURCES — PUBLIC READ UNCHANGED (TRANSPARENCY)
-- ============================================================================

-- Policy "Allow public read of sources" (USING (true)) is PRESERVED from initial schema.
-- No changes needed. Source transparency maintained.

-- ============================================================================
-- SECTION 6: ROUTES — PUBLIC READ ONLY VERIFIED
-- ============================================================================

CREATE POLICY "routes_public_verified"
ON public.routes FOR SELECT
TO anon
USING (verification_status = 'verified');

CREATE POLICY "routes_authenticated_public"
ON public.routes FOR SELECT
TO authenticated
USING (verification_status = 'verified');

CREATE POLICY "routes_staff_all"
ON public.routes FOR SELECT
TO authenticated
USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff') = 'true'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

CREATE POLICY "routes_service_all"
ON public.routes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SECTION 7: TRANSPORT TYPES & LOCATIONS — UNCHANGED (ACTIVE ONLY)
-- ============================================================================

-- Existing policies "Allow public read of active transport_types" and
-- "Allow public read of active locations" are PRESERVED.
-- No changes needed.

-- ============================================================================
-- SECTION 8: DISCOUNT TYPES — UNCHANGED (ACTIVE ONLY)
-- ============================================================================

-- Existing policy "Allow public read of active discount_types" is PRESERVED.
-- No changes needed.

-- ============================================================================
-- SECTION 9: OVERCHARGE REPORTS — SECURE ANONYMOUS SUBMISSION, CONTROLLED STATUS
-- ============================================================================

-- Add column to track anonymous submissions (non-breaking, default false)
ALTER TABLE public.overcharge_reports
ADD COLUMN IF NOT EXISTS submitted_by_anon boolean NOT NULL DEFAULT false;

-- Add column for rate-limiting tracking (IP hash, nullable)
-- Populated by edge function at submission time; not client-settable
ALTER TABLE public.overcharge_reports
ADD COLUMN IF NOT EXISTS submitter_ip_hash text;

-- ============================================================================
-- SECTION 10: REVOKE BROAD GRANTS, APPLY LEAST PRIVILEGE (MOVED BEFORE POLICIES)
-- ============================================================================
-- REVOKE ALL must run BEFORE column-level GRANTs so they are not stripped.
-- This block was previously Section 11; moved here for correct privilege ordering.

-- Revoke any broad grants that may have been applied
REVOKE ALL ON public.fare_rules FROM anon, authenticated;
REVOKE ALL ON public.fare_matrices FROM anon, authenticated;
REVOKE ALL ON public.tourism_prices FROM anon, authenticated;
REVOKE ALL ON public.sources FROM anon, authenticated;
REVOKE ALL ON public.routes FROM anon, authenticated;
REVOKE ALL ON public.overcharge_reports FROM anon, authenticated;
REVOKE ALL ON public.evidence_files FROM anon, authenticated;
REVOKE ALL ON public.transport_types FROM anon, authenticated;
REVOKE ALL ON public.locations FROM anon, authenticated;
REVOKE ALL ON public.discount_types FROM anon, authenticated;

-- Grant minimal permissions to anon (public web users via anon key)
GRANT SELECT ON public.transport_types TO anon;
GRANT SELECT ON public.locations TO anon;
GRANT SELECT ON public.sources TO anon;
GRANT SELECT ON public.discount_types TO anon;
GRANT SELECT ON public.fare_rules TO anon;
GRANT SELECT ON public.fare_matrices TO anon;
GRANT SELECT ON public.routes TO anon;
GRANT SELECT ON public.tourism_prices TO anon;
GRANT INSERT ON public.overcharge_reports TO anon;
-- NO GRANT UPDATE ON overcharge_reports TO anon (anon cannot update reports)
-- NO GRANT INSERT ON evidence_files TO anon (server-mediated via Edge Function)

-- Grant minimal permissions to authenticated (logged-in users)
GRANT SELECT ON public.transport_types TO authenticated;
GRANT SELECT ON public.locations TO authenticated;
GRANT SELECT ON public.sources TO authenticated;
GRANT SELECT ON public.discount_types TO authenticated;
GRANT SELECT ON public.fare_rules TO authenticated;
GRANT SELECT ON public.fare_matrices TO authenticated;
GRANT SELECT ON public.routes TO authenticated;
GRANT SELECT ON public.tourism_prices TO authenticated;
GRANT INSERT ON public.overcharge_reports TO authenticated;
GRANT SELECT ON public.overcharge_reports TO authenticated;
GRANT SELECT ON public.evidence_files TO authenticated;
-- NO GRANT INSERT ON evidence_files TO authenticated (server-mediated via Edge Function)

-- Column-level UPDATE for authenticated: only non-sensitive fields on own reports
-- Protected columns (user_id, submitted_by_anon, submitter_ip_hash, status, created_at)
-- are deliberately EXCLUDED from this grant. RLS policy "overcharge_reports_auth_update_own_fields"
-- restricts UPDATE to own reports (user_id = auth.uid()), and column-level privilege
-- prevents modification of protected fields even if RLS is bypassed.
GRANT UPDATE (transport_type_id, origin_location_id, destination_location_id,
              origin_text, destination_text, expected_fare, charged_fare,
              vehicle_plate, operator, driver_details, notes, occurred_at)
ON public.overcharge_reports TO authenticated;

-- Service role retains full access (bypasses RLS by default, but policies explicit)
GRANT ALL ON public.fare_rules TO service_role;
GRANT ALL ON public.fare_matrices TO service_role;
GRANT ALL ON public.tourism_prices TO service_role;
GRANT ALL ON public.sources TO service_role;
GRANT ALL ON public.routes TO service_role;
GRANT ALL ON public.overcharge_reports TO service_role;
GRANT ALL ON public.evidence_files TO service_role;
GRANT ALL ON public.transport_types TO service_role;
GRANT ALL ON public.locations TO service_role;
GRANT ALL ON public.discount_types TO service_role;

-- Anonymous INSERT (role=anon):
--   - user_id MUST be NULL
--   - submitted_by_anon MUST be true
--   - status MUST be 'pending'
CREATE POLICY "overcharge_reports_anon_insert"
ON public.overcharge_reports FOR INSERT
TO anon
WITH CHECK (
    current_user = 'anon'
    AND user_id IS NULL
    AND submitted_by_anon = true
    AND status = 'pending'
);

-- Authenticated INSERT (role=authenticated):
--   - user_id MUST match auth.uid()
--   - submitted_by_anon MUST be false
--   - status MUST be 'pending'
CREATE POLICY "overcharge_reports_authenticated_insert"
ON public.overcharge_reports FOR INSERT
TO authenticated
WITH CHECK (
    current_user = 'authenticated'
    AND user_id = auth.uid()
    AND submitted_by_anon = false
    AND status = 'pending'
);

-- Authenticated users read ONLY their own reports (user_id = auth.uid())
-- Anon users have NO SELECT policy (cannot read any reports)
CREATE POLICY "overcharge_reports_auth_read_own"
ON public.overcharge_reports FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff (via app_metadata.claims.staff = true) or service_role: full access for review
CREATE POLICY "overcharge_reports_staff_all"
ON public.overcharge_reports FOR ALL
TO authenticated
USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff') = 'true'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
)
WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff') = 'true'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

-- Authenticated users can UPDATE only non-protected fields on their own reports
-- Protected columns (status, submitted_by_anon, user_id, submitter_ip_hash, created_at)
-- are NOT granted UPDATE privilege to authenticated role (see REVOKE above)
CREATE POLICY "overcharge_reports_auth_update_own_fields"
ON public.overcharge_reports FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
    user_id = auth.uid()
    -- status, submitted_by_anon, user_id, submitter_ip_hash, created_at cannot be changed
    -- because column-level GRANT excludes them
);

-- ============================================================================
-- SECTION 11: EVIDENCE FILES — SECURE SERVER-MEDIATED UPLOAD
-- ============================================================================

-- CRITICAL: Evidence upload is mediated by a Supabase Edge Function.
-- Database policies here are DEFENSE-IN-DEPTH only.
-- The Edge Function:
--   1. Verifies the report exists and ownership matches the caller
--   2. Generates an unguessable, time-limited Storage path (signed URL)
--   3. Inserts the evidence_files row with verified report_id
-- Direct database INSERT by clients is DENIED.

-- NO INSERT policy for anon or authenticated roles.
-- Only service_role and staff (via Edge Function using service_role key) can INSERT.

CREATE POLICY "evidence_files_service_all"
ON public.evidence_files FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Staff can SELECT all evidence for review
CREATE POLICY "evidence_files_staff_select"
ON public.evidence_files FOR SELECT
TO authenticated
USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff') = 'true'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

-- Authenticated users can SELECT evidence for their own reports (defense-in-depth)
CREATE POLICY "evidence_files_auth_read_own"
ON public.evidence_files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.overcharge_reports r
        WHERE r.id = report_id
          AND r.user_id = auth.uid()
    )
);

-- ============================================================================
-- SECTION 12: STAFF STATUS-UPDATE WORKFLOW (REQUIRES SERVER-SIDE IMPLEMENTATION)
-- ============================================================================
-- The column-level GRANT and RLS policy "overcharge_reports_auth_update_own_fields"
-- allow authenticated users to update only non-sensitive fields on their own reports.
-- Staff (app_metadata.claims.staff = true) have full access via "overcharge_reports_staff_all"
-- including status transitions (pending → resolved/dismissed).
--
-- SECURITY NOTE: Status transitions by staff MUST go through a secure server-side workflow
-- (e.g., Supabase Edge Function using service_role) that:
--   1. Verifies the caller has valid staff claim
--   2. Logs the status change with timestamp and staff identity
--   3. Enforces business rules (e.g., cannot reopen dismissed reports)
-- Direct client UPDATE of status by staff is NOT prevented by column-level grants
-- (staff has service_role GRANT ALL), so the application layer must enforce
-- the workflow. This is documented here for implementation outside this migration.

-- ============================================================================
-- SECTION 13: VALIDATION QUERIES (run after migration to verify)
-- ============================================================================

-- Verify fare_rules public visibility: should show ONLY verified+source+current
-- SELECT f.*, tt.name FROM public.fare_rules f JOIN public.transport_types tt ON tt.id = f.transport_type_id WHERE f.verification_status = 'verified' AND f.source_id IS NOT NULL AND f.effective_from <= CURRENT_DATE AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE);

-- Verify tourism_prices public visibility: should show ONLY verified+source+official/published (4 records)
-- SELECT tp.*, l.name FROM public.tourism_prices tp LEFT JOIN public.locations l ON l.id = tp.location_id WHERE tp.verification_status = 'verified' AND tp.source_id IS NOT NULL AND tp.price_type IN ('official','establishment_published');

-- Verify conflicting_data tourism prices are hidden from public (should return 0 for anon)
-- SELECT count(*) FROM public.tourism_prices WHERE verification_status = 'conflicting_data';

-- Verify overcharge_reports: anon can insert with user_id=NULL, submitted_by_anon=true, status=pending
-- INSERT INTO public.overcharge_reports (transport_type_id, charged_fare, occurred_at, user_id, submitted_by_anon, status) VALUES ((SELECT id FROM public.transport_types LIMIT 1), 50.00, now(), NULL, true, 'pending');

-- Verify evidence_files: direct INSERT denied for anon/authenticated
-- INSERT INTO public.evidence_files (report_id, storage_path, file_name) VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'test.jpg'); -- should fail

-- Verify all 69 records preserved
-- SELECT 'sources' as table, count(*) FROM public.sources
-- UNION ALL SELECT 'transport_types', count(*) FROM public.transport_types WHERE active = true
-- UNION ALL SELECT 'fare_rules', count(*) FROM public.fare_rules
-- UNION ALL SELECT 'discount_types', count(*) FROM public.discount_types WHERE active = true
-- UNION ALL SELECT 'locations', count(*) FROM public.locations WHERE active = true
-- UNION ALL SELECT 'tourism_prices', count(*) FROM public.tourism_prices
-- UNION ALL SELECT 'routes', count(*) FROM public.routes
-- UNION ALL SELECT 'fare_matrices', count(*) FROM public.fare_matrices;

-- Verify migration idempotency: re-run should produce no errors and no changes
-- (Run this migration twice in isolated test DB)

COMMIT;

-- ============================================================================
-- POST-MIGRATION APPLICATION CODE CHANGES REQUIRED (NOT IN THIS MIGRATION)
-- ============================================================================
-- 1. fareApi.ts: fetchFareRuleForTransport already filters by effective date.
--    No change needed — RLS now enforces verification_status='verified' at DB level.
--
-- 2. dataApi.ts: fetchTourismPrices currently fetches ALL.
--    Application must handle empty/unverified state gracefully (already does via
--    VerificationBadge showing 'check_source'/'unverified'/'conflicting_data').
--    Public queries will now return only verified+official prices.
--
-- 3. ReportPage: submitOverchargeReport must call Edge Function for submission.
--    Edge Function sets user_id=NULL, submitted_by_anon=true, status='pending',
--    and submitter_ip_hash. Direct DB INSERT with these values also works.
--
-- 4. Evidence upload: Client calls Edge Function to get signed Storage URL,
--    uploads file, Edge Function inserts evidence_files row.
--    Direct DB INSERT to evidence_files will fail for anon/authenticated.
--
-- 5. Staff role: Provision via Supabase Auth admin API using app_metadata.
--    Example: supabase.auth.admin.updateUserById(uid, { app_metadata: { staff: true } })
--    The 'staff' claim in app_metadata is server-controlled, not editable by client.