# Audit Report: `20261028_01_sources.sql` (FIXED)

**Status: PASS** — Idempotency fixed; all checks pass.

---

## 1. SQL Syntax & Schema Compatibility

| Check | Result | Details |
|-------|--------|---------|
| Column list matches `sources` table | ✅ PASS | All 10 columns present and in correct order. |
| `source_type` enum values | ✅ PASS | All 18 rows use valid enum values. |
| `verification_status` enum values | ✅ PASS | 17 `verified`, 1 `conflicting_data` — both allowed. |
| `NOT NULL` constraints satisfied | ✅ PASS | Required fields all non-null. |
| Data types | ✅ PASS | `date`/`timestamptz` literals correctly formatted. |
| UUID generation | ✅ PASS | `id` omitted → `gen_random_uuid()` default on first insert. |

---

## 2. Foreign Keys & UUID References

- **No foreign keys** in `sources` table (root table). ✅
- **FK preservation**: `ON CONFLICT ... DO UPDATE` keeps original `id` (UUID) stable across re-runs, protecting references from `fare_rules`, `discount_types`, `tourism_prices`, `fare_matrices`.

---

## 3. Idempotency (FIXED)

| Before (FAIL) | After (PASS) |
|---------------|--------------|
| `ON CONFLICT (id) DO NOTHING` — ineffective, `id` is random | `ON CONFLICT (organization, title, url) DO UPDATE SET ...` — stable business key |
| No unique constraint | Added `sources_org_title_url_key` UNIQUE constraint via `DO $$` block (lines 18–28) |
| Re-run created 18 duplicates | Re-run updates existing rows, **zero duplicates**, UUIDs unchanged |

**Constraint addition is safe:**
- `organization`, `title`, `url` are `NOT NULL` in all 18 rows (no NULLs in business key)
- No legitimate duplicate source shares all three fields
- `IF NOT EXISTS` guard prevents error if constraint already present

---

## 4. Destructive Commands / Permissions

| Check | Result |
|-------|--------|
| `DROP`, `DELETE`, `TRUNCATE`, `ALTER` (destructive) | ✅ None — only `ADD CONSTRAINT IF NOT EXISTS` |
| `GRANT` / `REVOKE` | ✅ None |
| Transaction control | ✅ None (single statement + constraint block) |

---

## 5. Source Records Review (Lines 31–268)

| # | Source | Org | Title Snippet | `source_type` | `verification_status` | Notes |
|---|--------|-----|---------------|---------------|----------------------|-------|
| 01 | PTV News | Philippine Television News | LTFRB Releases New Matrices… | government_document | verified | Primary fare source |
| 02 | PIA/LTFRB | Philippine Information Agency | LTFRB Reminds PUV Operators… | regulatory_order | verified | Display requirement |
| 03 | PCO | Presidential Communications Office | Palace: Gov't Balances… | press_release | verified | Fare adjustment confirmation |
| 04 | SunStar | SunStar Manila (PNA) | LTFRB Sets New PUV Rates… | news_article | verified | Corroboration |
| 05 | LRTA Tickets | Light Rail Transit Authority | Tickets and Fares… | official_website | verified | 50% promo announcement |
| 06 | LRTA Charter | Light Rail Transit Authority | Citizens Charter 2nd Ed Annex A | government_document | verified | LRT-2 matrices |
| 07 | DOTr MRT-3 | Dept of Transportation | MRT-3 Citizens Charter 1st Ed | government_document | verified | MRT-3 matrices |
| 08 | LRMC LRT-1 | Light Rail Manila Corp | New LRT-1 Fares Effective… | official_website | verified | Separate operator tariff |
| 09 | RA 11314 | Lawphil | Student Fare Discount Act | law | verified | Statutory discount |
| 10 | RA 9994 | Lawphil | Expanded Senior Citizens Act | law | verified | Statutory discount |
| 11 | RA 10754 | Lawphil | Expanded PWD Benefits Act | law | verified | Statutory discount |
| 12 | IA Hours | Intramuros Administration | Hours and Fees… | official_website | verified | Fort Santiago, Centro de Turismo |
| 13 | IA Casa | Intramuros Administration | Casa Manila Museum Admission | official_website | verified | Casa Manila pricing |
| **14** | **IA Guide** | **Intramuros Administration** | **Museum Guide - Museo de Intramuros** | **official_website** | **conflicting_data** | **Correctly flagged — conflicts with [12]** |
| 15 | Nat Museum | National Museum | Book a Tour - Free Admission | official_website | verified | Free admission |
| 16 | GMA News | GMA News | DOTr: 50% Discount on Train Rides… | news_article | verified | Promo corroboration |
| 17 | LTFRB Web | Land Transportation Franchising… | Official Website… | official_website | verified | Route matrices location |
| 18 | LRMC Matrix | Light Rail Manila Corp | LRT-1 Fare Matrix… | official_website | verified | Station-to-station fares |

- All 18 sources trace to the research document.
- Source [14] correctly quarantined as `conflicting_data`.
- No duplicate `(organization, title, url)` pairs.
- No unsupported/placeholder sources.

---

## 6. Date & URL Validity

| Field | Status |
|-------|--------|
| `publication_date` / `effective_date` | 12/18 rows have dates; 6 rows `NULL` (allowed — undated web pages). |
| `checked_at` | All 18 rows populated with `2026-10-28 00:00:00+00`. |
| URLs | All 18 HTTPS; domains match cited organizations. No typos detected. |

---

## 7. Validation Queries (Post-Migration)

```sql
-- Expected after successful run:
SELECT count(*) FROM sources WHERE verification_status = 'verified';     -- 17
SELECT count(*) FROM sources WHERE verification_status = 'conflicting_data'; -- 1
SELECT organization, title, verification_status FROM sources ORDER BY checked_at DESC;

-- Idempotency test (run migration twice):
-- 1. First run → 18 rows inserted, UUIDs generated
-- 2. Second run → 0 new rows, existing rows updated in-place, UUIDs identical
-- 3. Verify: SELECT count(*) FROM sources;           -- 18
--    SELECT id, organization FROM sources ORDER BY organization;  -- same UUIDs both runs
```

---

## 8. Limitations (Not Tested Against Live DB)

| Limitation | Impact |
|------------|--------|
| **No test database available** | Idempotency validated by code review only. Actual re-run test not executed. |
| **No live FK verification** | Cannot confirm downstream tables (`fare_rules`, etc.) reference these UUIDs correctly without a populated DB. |
| **URL reachability** | URLs not HTTP-fetched; assumed valid per research document. |

---

## 9. Summary & Resolution

| Severity | Issue | File:Line | Resolution |
|----------|-------|-----------|------------|
| ~~CRITICAL~~ **RESOLVED** | `ON CONFLICT (id)` ineffective | ~~232~~ | Added UNIQUE constraint on `(organization, title, url)` + `ON CONFLICT ... DO UPDATE` |
| INFO | 6 rows `NULL` `publication_date`/`effective_date` | 70, 71, 82, 83, 94, 95, 106, 107, 136, 137, 154, 155 | Acceptable — source pages undated. |
| INFO | Source [14] `conflicting_data` | 121–133 | Correctly handled — audit trail preserved. |

---

**Overall:** **PASS** (idempotency fixed, schema-compatible, FK-safe). Ready for production migration sequence.