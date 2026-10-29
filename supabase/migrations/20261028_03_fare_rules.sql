-- ============================================================================
-- FAREFAIR V1.4 | MIGRATION 03 | REVISED FARE RULES
-- Prepared: 2026-10-29
--
-- DO NOT RUN IN PRODUCTION WITHOUT REVIEW AND AN ISOLATED DATABASE TEST.
--
-- Design:
--   * Compatible with the supplied existing public.fare_rules schema.
--   * Inserts ONLY published distance-based road fare scales that fit the
--     existing table without missing monetary values or fake zero fares.
--   * Classifies every inserted record as 'check_source' because we checked
--     the dated PTV report, NOT every original LTFRB matrix PDF and its
--     route-specific/rounding instructions.
--   * Does NOT insert metered, time-based, per-300m, station-specific,
--     unknown-base, conflicting, or placeholder fare rules.
--   * Uses an advisory transaction lock, explicit preflight validations,
--     and existing-row comparisons to make reruns safe for this migration.
--   * Does not DROP/ALTER tables, change RLS, or overwrite existing rows.
--
-- Published reporting source (28 September 2026):
-- https://ptvnews.ph/ltfrb-releases-new-matrices-for-puv-fare-hikes-effective-sept-28/
-- Regulatory context / matrix requirement:
-- https://pia.gov.ph/news/luzon/ncr/ltfrb-reminds-puv-operators-drivers-to-display-updated-fare-matrix
--
-- IMPORTANT: 'check_source' is not a consumer-facing verified fare.
-- Do not promote rows to 'verified' until the applicable original fare guide
-- and actual fare calculation/rounding rules have been independently checked.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '45s';

DO $farefair_m03$
DECLARE
    v_source_id          uuid;
    v_source_count       integer;
    v_transport_id       uuid;
    v_transport_count    integer;
    v_matching_count     integer;
    v_candidate          record;
BEGIN
    -- Serialize repeated runs of this migration against one another.
    -- A different writer that ignores this advisory lock is NOT protected.
    PERFORM pg_advisory_xact_lock(20261028, 3);

    -- Migration 01 must already have stored the PTV report as one source.
    -- Never silently insert an unreferenced fare rule.
    SELECT count(*)
      INTO v_source_count
      FROM public.sources
     WHERE url LIKE
       'https://ptvnews.ph/ltfrb-releases-new-matrices-for-puv-fare-hikes-effective-sept-28%';

    IF v_source_count <> 1 THEN
        RAISE EXCEPTION
          'Migration 03 needs exactly one PTV source record; found %',
          v_source_count;
    END IF;

    SELECT id
      INTO v_source_id
      FROM public.sources
     WHERE url LIKE
       'https://ptvnews.ph/ltfrb-releases-new-matrices-for-puv-fare-hikes-effective-sept-28%';

    IF v_source_id IS NULL THEN
        RAISE EXCEPTION 'Migration 03 source UUID is NULL';
    END IF;

    -- All 9 rows below come from the PTV September 28, 2026 fare guide.
    -- Columns: transport name, regular minimum, included km,
    --           regular extra/km, published concession minimum,
    --           published concession extra/km, effective date.
    --
    -- No rounding_rule is inferred from an article's table. It stays NULL.
    FOR v_candidate IN
      SELECT *
        FROM (VALUES
          ('Traditional Jeepney',             14.00::numeric, 4.00::numeric, 2.00::numeric, 11.25::numeric, 1.60::numeric, DATE '2026-09-28'),
          ('Modern Jeepney',                  17.00::numeric, 4.00::numeric, 2.40::numeric, 13.50::numeric, 1.92::numeric, DATE '2026-09-28'),
          ('Ordinary City Bus',               15.00::numeric, 5.00::numeric, 2.49::numeric, 12.00::numeric, 1.99::numeric, DATE '2026-09-28'),
          ('Air-conditioned City Bus',        18.00::numeric, 5.00::numeric, 2.98::numeric, 14.50::numeric, 2.38::numeric, DATE '2026-09-28'),
          ('EDSA Busway',                     18.00::numeric, 5.00::numeric, 2.98::numeric, 14.40::numeric, 2.38::numeric, DATE '2026-09-28'),
          ('Provincial Bus - Ordinary',       12.00::numeric, 5.00::numeric, 2.20::numeric,  9.50::numeric, 1.76::numeric, DATE '2026-09-28'),
          ('Provincial Bus - Air-conditioned',12.25::numeric, 5.00::numeric, 2.45::numeric,  9.75::numeric, 1.96::numeric, DATE '2026-09-28'),
          ('Provincial Bus - Deluxe',         13.00::numeric, 5.00::numeric, 2.60::numeric, 10.50::numeric, 2.08::numeric, DATE '2026-09-28'),
          ('Provincial Bus - Super Deluxe',   13.50::numeric, 5.00::numeric, 2.70::numeric, 10.75::numeric, 2.16::numeric, DATE '2026-09-28')
        ) AS x(transport_name, base_fare, included_distance_km,
               additional_rate_per_km, discounted_base_fare,
               discounted_additional_rate, effective_from)
    LOOP
      -- Require exactly one transport category from Migration 02.
      SELECT count(*)
        INTO v_transport_count
        FROM public.transport_types
       WHERE name = v_candidate.transport_name;

      IF v_transport_count <> 1 THEN
        RAISE EXCEPTION
          'Expected one transport type named %, found %',
          v_candidate.transport_name, v_transport_count;
      END IF;

      SELECT id
        INTO v_transport_id
        FROM public.transport_types
       WHERE name = v_candidate.transport_name;

      -- Any existing record with the same transport and effective date is
      -- either this exact source-supported row or requires manual review.
      -- Never silently replace a different fare or verification status.
      SELECT count(*)
        INTO v_matching_count
        FROM public.fare_rules AS f
       WHERE f.transport_type_id = v_transport_id
         AND f.effective_from = v_candidate.effective_from;

      IF v_matching_count > 1 THEN
        RAISE EXCEPTION
          'Duplicate fare rules already exist for % on %; review them first',
          v_candidate.transport_name, v_candidate.effective_from;
      END IF;

      IF v_matching_count = 1 THEN
        IF NOT EXISTS (
            SELECT 1
              FROM public.fare_rules AS f
             WHERE f.transport_type_id = v_transport_id
               AND f.effective_from = v_candidate.effective_from
               AND f.base_fare = v_candidate.base_fare
               AND f.included_distance_km = v_candidate.included_distance_km
               AND f.additional_rate_per_km = v_candidate.additional_rate_per_km
               AND f.discounted_base_fare = v_candidate.discounted_base_fare
               AND f.discounted_additional_rate = v_candidate.discounted_additional_rate
               AND f.rounding_rule IS NULL
               AND f.effective_until IS NULL
               AND f.verification_status = 'check_source'
               AND f.source_id = v_source_id
        ) THEN
          RAISE EXCEPTION
            'Existing fare rule differs for % on %. No overwrite performed',
            v_candidate.transport_name, v_candidate.effective_from;
        END IF;

        -- Exact match: idempotent no-op (UUID and history preserved).
        CONTINUE;
      END IF;

      -- If an older fare remains open-ended, the effective periods would
      -- overlap. Do not alter historical records without separate approval.
      IF EXISTS (
          SELECT 1
            FROM public.fare_rules AS f
           WHERE f.transport_type_id = v_transport_id
             AND f.effective_from < v_candidate.effective_from
             AND (f.effective_until IS NULL
                  OR f.effective_until >= v_candidate.effective_from)
      ) THEN
        RAISE EXCEPTION
          'Prior fare period overlaps % on %. Review historical dates',
          v_candidate.transport_name, v_candidate.effective_from;
      END IF;

      INSERT INTO public.fare_rules (
          transport_type_id,
          base_fare,
          included_distance_km,
          additional_rate_per_km,
          discounted_base_fare,
          discounted_additional_rate,
          rounding_rule,
          effective_from,
          effective_until,
          verification_status,
          source_id
      ) VALUES (
          v_transport_id,
          v_candidate.base_fare,
          v_candidate.included_distance_km,
          v_candidate.additional_rate_per_km,
          v_candidate.discounted_base_fare,
          v_candidate.discounted_additional_rate,
          NULL,
          v_candidate.effective_from,
          NULL,
          'check_source',
          v_source_id
      );
    END LOOP;
END;
$farefair_m03$;

COMMIT;

-- ============================================================================
-- AFTER APPLYING TO AN ISOLATED TEST DATABASE, RUN THESE READ-ONLY CHECKS:
-- ============================================================================
--
-- SELECT tt.name, f.base_fare, f.included_distance_km,
--        f.additional_rate_per_km, f.discounted_base_fare,
--        f.discounted_additional_rate, f.rounding_rule,
--        f.effective_from, f.verification_status, s.url AS source_url
--   FROM public.fare_rules AS f
--   JOIN public.transport_types AS tt ON tt.id = f.transport_type_id
--   LEFT JOIN public.sources AS s ON s.id = f.source_id
--  WHERE f.effective_from = DATE '2026-09-28'
--  ORDER BY tt.name;
--
-- SELECT tt.name, f.effective_from, count(*) AS same_date_count
--   FROM public.fare_rules AS f
--   JOIN public.transport_types AS tt ON tt.id = f.transport_type_id
--  GROUP BY tt.name, f.effective_from
-- HAVING count(*) > 1;
--
-- NOTE: Test execution twice on an isolated database. The second run should
-- add zero rows and retain UUIDs. This has NOT been tested against PostgreSQL
-- in this authoring environment. Do NOT claim that it has.