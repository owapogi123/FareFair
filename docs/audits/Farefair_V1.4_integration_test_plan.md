# Farefair V1.4 — Integration Testing Plan for Migrations 01–06

**Date:** 2026-10-29
**Author:** Senior PostgreSQL Database Engineer / Supabase Architect
**Status:** READY FOR REVIEW — Awaiting Explicit Approval Before Execution

---

## 1. Executive Summary

This plan covers isolated integration testing of six corrected Supabase migrations (01–06) for the Farefair V1.4 Philippine fare transparency application. All migrations have passed static analysis audits with corrections applied for idempotency, foreign key integrity, and schema compatibility.

**No production SQL will be executed.** Testing will target an isolated local PostgreSQL instance or a dedicated Supabase development project — **never** the production Supabase project.

---

## 2. Migration Inventory & Execution Order

| Order | Migration File | Records | Dependencies | Idempotency Mechanism |
|-------|---------------|---------|--------------|----------------------|
| 1 | `20261028_01_sources.sql` | 18 sources (17 verified, 1 conflicting_data) | None (schema only) | `UNIQUE (organization, title, url)` + `ON CONFLICT DO UPDATE` |
| 2 | `20261028_02_transport_types.sql` | 27 transport types | Sources (01) | `UNIQUE (name)` + `ON CONFLICT DO UPDATE` |
| 3 | `20261028_03_fare_rules.sql` | 9 fare rules (all `check_source`) | Sources (01), Transport Types (02) | Advisory lock + exact-match check + `CONTINUE` (no unique constraint) |
| 4 | `20261028_04_discount_types.sql` | 4 discount types (3 statutory, 1 promo) | Sources (01), Transport Types (02) | `UNIQUE (name)` + `ON CONFLICT DO UPDATE` |
| 5 | `20261028_05_locations_tourism.sql` | 5 Manila/Intramuros locations | Locations table (schema) | `UNIQUE (name, city)` + `ON CONFLICT DO UPDATE` + `RETURNING id` |
| 6 | `20261028_06_tourism_prices.sql` | 6 tourism prices (4 verified, 2 conflicting_data) | Sources (01), Locations (05) | `UNIQUE (location_id, establishment_name, item_name)` + `ON CONFLICT DO UPDATE` |

**Total Records:** 69 source-backed records across 6 tables

---

## 3. Migration 04 Discount Record-Count Documentation

### 3.1 Records in Migration 04 (Confirmed: 4 Total)

| # | Discount Name | Type | Percentage | Legal Basis | Source(s) | Applicable Transports |
|---|--------------|------|------------|-------------|-----------|----------------------|
| 1 | **Student Fare Discount** | Statutory (permanent) | 20% | RA 11314 (2019) | [09] lawphil.net | 16 types: jeepneys, buses, UV Express, P2P, MRT-3, LRT-1, LRT-2 |
| 2 | **Senior Citizen Fare Discount** | Statutory (permanent) | 20% | RA 9994 (2010) | [10] lawphil.net | 19 types: + taxis (regular, premium, airport) |
| 3 | **PWD Fare Discount** | Statutory (permanent) | 20% (at least) | RA 10754 (2016) | [11] lawphil.net | 23 types: + TNVS (all 4 classes) |
| 4 | **MRT-3 / LRT-2 50% Promotional Fare** | Promotional (time-limited) | 50% | DOTr Memo / LRTA Citizens Charter 2026 | [05] LRTA + [16] GMA News | MRT-3, LRT-2 only |

**Note:** The audit found **no discrepancy** — 4 records is correct and matches the legal/regulatory landscape. Three are permanent statutory discounts mandated by Republic Acts; one is a temporary DOTr promotional fare effective 2026-03-23 "until further notice."

### 3.2 Stacking Prevention (Verified in Application)

- Application architecture supports **single discount selection only** (`calculateFare()` accepts one `DiscountType`)
- Promotional discount description explicitly states: *"Cannot be combined with Student, Senior, or PWD 20% discounts for the same trip."*
- RA 10754 (PWD) explicitly prohibits stacking with other 50% promotions
- UI (FareChecker Step 4) allows only one discount to be selected

---

## 4. Museo de Intramuros Conflicting Prices — Source Traceability Verification

### 4.1 Two Distinct Records Preserved (No Artificial Product Names)

| Record | Item Name (Distinct) | Price | Discounted | Verification Status | Source | Source `information_supported` |
|--------|---------------------|-------|------------|---------------------|--------|-------------------------------|
| 1 | `Admission (per Hours & Fees page)` | ₱150.00 | ₱120.00 | `conflicting_data` | [12] Intramuros Hours & Fees | *"Fort Santiago P75/P50, Centro de Turismo P150/P120; potentially conflicting Museo de Intramuros fee information"* |
| 2 | `Admission (per Museum Guide page)` | ₱200.00 | ₱160.00 | `conflicting_data` | [14] Intramuros Museum Guide | *"Museo de Intramuros P200 regular / P160 discounted; CONFLICTS with Hours & Fees page (P150/P120)"* |

### 4.2 Unique Constraint Design (Validated)

```sql
UNIQUE (location_id, establishment_name, item_name)
```

- **Same** `location_id` (Museo de Intramuros)
- **Same** `establishment_name` (Museo de Intramuros)
- **DIFFERENT** `item_name` → **Both records coexist** — no artificial naming needed

### 4.3 Application Display Behavior (Verified)

| Component | Behavior with `conflicting_data` |
|-----------|----------------------------------|
| `TouristPricesPage.tsx` | Shows `VerificationBadge` = "Conflicting Data" (AlertCircle icon, distinct styling) |
| `SourcesPage.tsx` | Shows source `information_supported` text explaining the conflict |
| `VerificationBadge.tsx` | Explicit `conflicting_data` case with unique label/icon/class |
| API (`dataApi.ts`) | Returns full `source` object with `information_supported` via join |

**Result:** Both prices are traceable to their specific source via `source_id` FK. Neither is presented as "verified" or "authorized" consumer fare.

---

## 5. Target Test Database Decision

### 5.1 Options Evaluated

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Local PostgreSQL (Docker)** | Full control, no network dependency, free, instant reset | Not Supabase-specific (no Auth, Storage, Realtime, Edge Functions) | ✅ **PRIMARY** for schema/migration testing |
| **Supabase Dev Project (Separate Org)** | Exact Supabase parity (Auth, RLS, Realtime, Storage) | Requires separate project setup, potential cost, network latency | ✅ **SECONDARY** for full integration testing |

### 5.2 Recommended Approach: **Local PostgreSQL First**

```bash
# Start isolated PostgreSQL 16+ with pgcrypto
docker run -d \
  --name farefair-test-db \
  -e POSTGRES_DB=farefair_test \
  -e POSTGRES_USER=farefair \
  -e POSTGRES_PASSWORD=testpass \
  -p 5433:5432 \
  postgres:16-alpine
```

**Connection String:** `postgresql://farefair:testpass@localhost:5433/farefair_test`

**Why:** Fastest iteration, zero cost, full DDL/DML control, perfect for migration validation. Supabase-specific features (RLS policies, Auth) can be validated in a follow-up Supabase dev project test.

### 5.3 Explicit Confirmation Required

> **Please confirm:** Target database for initial test run = **Local PostgreSQL (Docker) on port 5433**?
>
> If you prefer a Supabase dev project, provide the connection string and I'll adapt the plan.

---

## 6. Test Suite Definition

### 6.1 Phase 1: Schema & Migration Execution (Local PostgreSQL)

| Test ID | Description | Expected Result | Verification Query |
|---------|-------------|-----------------|-------------------|
| T1.1 | Apply `supabase/schema.sql` | All 9 tables created with RLS policies | `\dt` shows 9 tables; `\d+ table_name` shows policies |
| T1.2 | Run Migration 01 (sources) | 18 rows inserted, UUIDs generated | `SELECT count(*) FROM sources;` → 18 |
| T1.3 | Run Migration 02 (transport_types) | 27 rows inserted, UUIDs generated | `SELECT count(*) FROM transport_types WHERE active;` → 27 |
| T1.4 | Run Migration 03 (fare_rules) | 9 rows inserted, all `check_source` | `SELECT count(*) FROM fare_rules WHERE verification_status='check_source';` → 9 |
| T1.5 | Run Migration 04 (discount_types) | 4 rows inserted, all `verified` | `SELECT count(*) FROM discount_types WHERE active;` → 4 |
| T1.6 | Run Migration 05 (locations) | 5 rows inserted, UUIDs returned | `SELECT count(*) FROM locations WHERE city='Manila';` → 5 |
| T1.7 | Run Migration 06 (tourism_prices) | 6 rows inserted, 4 verified + 2 conflicting | `SELECT verification_status, count(*) FROM tourism_prices GROUP BY verification_status;` → verified=4, conflicting_data=2 |

### 6.2 Phase 2: Idempotency & Duplicate Prevention (Re-run All Migrations)

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| T2.1 | Re-run Migration 01 | **0 new rows**, existing UUIDs unchanged |
| T2.2 | Re-run Migration 02 | **0 new rows**, existing UUIDs unchanged |
| T2.3 | Re-run Migration 03 | **0 new rows** (exact-match `CONTINUE`), existing UUIDs unchanged |
| T2.4 | Re-run Migration 04 | **0 new rows**, existing UUIDs unchanged |
| T2.5 | Re-run Migration 05 | **0 new rows**, existing UUIDs unchanged (`RETURNING id` works) |
| T2.6 | Re-run Migration 06 | **0 new rows**, existing UUIDs unchanged |
| T2.7 | Verify FK integrity after re-runs | All FK references resolve to same UUIDs as first run |

**Verification Queries (run after each re-run):**
```sql
-- Check row counts unchanged
SELECT 'sources' AS table, count(*) FROM sources
UNION ALL SELECT 'transport_types', count(*) FROM transport_types
UNION ALL SELECT 'fare_rules', count(*) FROM fare_rules
UNION ALL SELECT 'discount_types', count(*) FROM discount_types
UNION ALL SELECT 'locations', count(*) FROM locations
UNION ALL SELECT 'tourism_prices', count(*) FROM tourism_prices;

-- Verify UUID stability (compare with first-run UUIDs saved in temp table)
-- Example for sources:
CREATE TEMP TABLE first_run_sources AS SELECT id, organization, title FROM sources;
-- After re-run:
SELECT s.id, s.organization, s.title, f.id AS first_id
FROM sources s JOIN first_run_sources f ON s.organization=f.organization AND s.title=f.title
WHERE s.id <> f.id;  -- Should return 0 rows
```

### 6.3 Phase 3: Foreign Key & Referential Integrity

| Test ID | Description | Verification Query |
|---------|-------------|-------------------|
| T3.1 | All `fare_rules.transport_type_id` → valid `transport_types.id` | `SELECT count(*) FROM fare_rules fr LEFT JOIN transport_types tt ON fr.transport_type_id=tt.id WHERE tt.id IS NULL;` → 0 |
| T3.2 | All `fare_rules.source_id` → valid `sources.id` | `SELECT count(*) FROM fare_rules fr LEFT JOIN sources s ON fr.source_id=s.id WHERE fr.source_id IS NOT NULL AND s.id IS NULL;` → 0 |
| T3.3 | All `discount_types.source_id` → valid `sources.id` | Same pattern → 0 |
| T3.4 | All `discount_types.applicable_transports[]` → valid `transport_types.id` | `SELECT dt.name, jsonb_array_elements_text(dt.applicable_transports)::uuid AS tid FROM discount_types dt WHERE NOT EXISTS (SELECT 1 FROM transport_types tt WHERE tt.id = (jsonb_array_elements_text(dt.applicable_transports)::uuid));` → 0 rows |
| T3.5 | All `tourism_prices.location_id` → valid `locations.id` | Same pattern → 0 |
| T3.6 | All `tourism_prices.source_id` → valid `sources.id` | Same pattern → 0 |

### 6.4 Phase 4: Row Level Security (RLS) Validation

| Test ID | Description | Test Method | Expected |
|---------|-------------|-------------|----------|
| T4.1 | Anonymous can `SELECT` from all public tables | `SET ROLE anon; SELECT * FROM sources;` | Success for all 6 migrated tables |
| T4.2 | Anonymous **cannot** `INSERT/UPDATE/DELETE` | `SET ROLE anon; INSERT INTO sources ...` | **Error** (no policy for write) |
| T4.3 | `locations` policy filters `active=true` | Insert inactive location, query as anon | Inactive row not returned |
| T4.4 | `transport_types` policy filters `active=true` | Same as T4.3 | Inactive row not returned |
| T4.5 | `discount_types` policy filters `active=true` | Same as T4.3 | Inactive row not returned |

### 6.5 Phase 5: Application API Compatibility (TypeScript/React)

| Test ID | Description | Test Method | Expected |
|---------|-------------|-------------|----------|
| T5.1 | `fetchTourismPrices()` returns all 6 records with joins | Run via Supabase client against test DB | 6 objects with `location` and `source` populated |
| T5.2 | `conflicting_data` records have `source.information_supported` | Check API response for Museo records | Both have non-null `source.information_supported` with conflict details |
| T5.3 | `fetchDiscountTypes()` returns 4 active discounts | Run via Supabase client | 4 objects, all `active=true` |
| T5.4 | `fetchSources()` returns 18 sources | Run via Supabase client | 18 objects, 1 with `verification_status='conflicting_data'` |
| T5.5 | TypeScript types match DB columns | `npm run typecheck` (if configured) | No type errors |

### 6.6 Phase 6: Conflicting/Unverified/Unavailable Price Protection

| Test ID | Description | Test Method | Expected |
|---------|-------------|-------------|----------|
| T6.1 | `conflicting_data` prices excluded from "verified" fare display | Query `verification_status='verified'` only | Museo records **not** returned |
| T6.2 | `check_source` fare rules not presented as consumer fares | Query `verification_status='verified'` | 0 fare_rules returned (all 9 are `check_source`) |
| T6.3 | `unverified` prices not shown as authoritative | Query `verification_status IN ('verified','calculated')` | No `unverified` records returned |
| T6.4 | Free admission (National Museum ₱0) correctly distinguished from "price unknown" | Check `price=0` AND `verification_status='verified'` | Only National Museum record matches |
| T6.5 | No `NULL` prices treated as ₱0 | Query `price IS NULL` | 0 rows (all prices populated) |

### 6.7 Phase 7: Mock Data Absence Verification

| Test ID | Description | Verification |
|---------|-------------|--------------|
| T7.1 | No hardcoded test data in migrations | `grep -r "test\|mock\|fake\|placeholder" supabase/migrations/20261028_0*.sql` → only comments |
| T7.2 | All prices traceable to official sources | Every `source_id` resolves to a `sources` row with `source_type IN ('government_document','official_website','law','regulatory_order')` |
| T7.3 | No localStorage/sessionStorage/local JSON fallbacks in app | `grep -r "localStorage\|sessionStorage\|\.json" src/` → only in unrelated files (not fare/price logic) |

---

## 7. Exact Commands for Test Execution

### 7.1 Prerequisites

```bash
# 1. Start isolated PostgreSQL (run once)
docker run -d \
  --name farefair-test-db \
  -e POSTGRES_DB=farefair_test \
  -e POSTGRES_USER=farefair \
  -e POSTGRES_PASSWORD=testpass \
  -p 5433:5432 \
  postgres:16-alpine

# 2. Wait for readiness
sleep 5
docker exec farefair-test-db pg_isready -U farefair

# 3. Install psql client if needed (Windows: use pgAdmin or psql from PostgreSQL installer)
```

### 7.2 Apply Schema + Migrations (In Order)

```bash
# Set connection vars
export PGHOST=localhost
export PGPORT=5433
export PGDATABASE=farefair_test
export PGUSER=farefair
export PGPASSWORD=testpass

# 1. Apply schema
psql -f supabase/schema.sql

# 2. Run migrations in order
psql -f supabase/migrations/20261028_01_sources.sql
psql -f supabase/migrations/20261028_02_transport_types.sql
psql -f supabase/migrations/20261028_03_fare_rules.sql
psql -f supabase/migrations/20261028_04_discount_types.sql
psql -f supabase/migrations/20261028_05_locations_tourism.sql
psql -f supabase/migrations/20261028_06_tourism_prices.sql
```

### 7.3 Run Verification Queries (Phase 1–3)

```bash
# Row counts after initial run
psql -c "
SELECT 'sources' AS table, count(*) FROM sources
UNION ALL SELECT 'transport_types', count(*) FROM transport_types WHERE active
UNION ALL SELECT 'fare_rules', count(*) FROM fare_rules
UNION ALL SELECT 'discount_types', count(*) FROM discount_types WHERE active
UNION ALL SELECT 'locations', count(*) FROM locations WHERE city='Manila'
UNION ALL SELECT 'tourism_prices', count(*) FROM tourism_prices;
"

# Verification status breakdown
psql -c "SELECT verification_status, count(*) FROM tourism_prices GROUP BY verification_status;"
psql -c "SELECT verification_status, count(*) FROM fare_rules GROUP BY verification_status;"
psql -c "SELECT verification_status, count(*) FROM discount_types GROUP BY verification_status;"
psql -c "SELECT verification_status, count(*) FROM sources GROUP BY verification_status;"
```

### 7.4 Idempotency Re-run Test

```bash
# Save first-run UUIDs
psql -c "CREATE TEMP TABLE first_run_sources AS SELECT id, organization, title FROM sources;"
psql -c "CREATE TEMP TABLE first_run_transport AS SELECT id, name FROM transport_types;"
psql -c "CREATE TEMP TABLE first_run_fare AS SELECT id, transport_type_id, effective_from FROM fare_rules;"
psql -c "CREATE TEMP TABLE first_run_discount AS SELECT id, name FROM discount_types;"
psql -c "CREATE TEMP TABLE first_run_locations AS SELECT id, name, city FROM locations;"
psql -c "CREATE TEMP TABLE first_run_prices AS SELECT id, location_id, establishment_name, item_name FROM tourism_prices;"

# Re-run all migrations
psql -f supabase/migrations/20261028_01_sources.sql
psql -f supabase/migrations/20261028_02_transport_types.sql
psql -f supabase/migrations/20261028_03_fare_rules.sql
psql -f supabase/migrations/20261028_04_discount_types.sql
psql -f supabase/migrations/20261028_05_locations_tourism.sql
psql -f supabase/migrations/20261028_06_tourism_prices.sql

# Verify UUID stability
psql -c "
SELECT 'sources' AS table, count(*) FROM sources s JOIN first_run_sources f ON s.id=f.id
UNION ALL SELECT 'transport_types', count(*) FROM transport_types t JOIN first_run_transport f ON t.id=f.id
UNION ALL SELECT 'fare_rules', count(*) FROM fare_rules f JOIN first_run_fare o ON f.id=o.id
UNION ALL SELECT 'discount_types', count(*) FROM discount_types d JOIN first_run_discount o ON d.id=o.id
UNION ALL SELECT 'locations', count(*) FROM locations l JOIN first_run_locations o ON l.id=o.id
UNION ALL SELECT 'tourism_prices', count(*) FROM tourism_prices p JOIN first_run_prices o ON p.id=o.id;
"
-- Each should match the original row count (18, 27, 9, 4, 5, 6)
```

### 7.5 RLS Test

```bash
psql -c "
SET ROLE anon;
SELECT 'sources' AS table, count(*) FROM sources
UNION ALL SELECT 'transport_types', count(*) FROM transport_types
UNION ALL SELECT 'fare_rules', count(*) FROM fare_rules
UNION ALL SELECT 'discount_types', count(*) FROM discount_types
UNION ALL SELECT 'locations', count(*) FROM locations
UNION ALL SELECT 'tourism_prices', count(*) FROM tourism_prices;
"
```

### 7.6 Cleanup

```bash
docker stop farefair-test-db && docker rm farefair-test-db
```

---

## 8. React/Vite Application Compatibility Checklist

| Area | Check | Method | Status |
|------|-------|--------|--------|
| **Types** | `src/types/index.ts` matches all DB columns | Manual cross-reference + TypeScript compile | ✅ Verified in audit |
| **API** | `dataApi.ts` joins work with new columns | Run against test DB | ⏳ Pending test DB |
| **API** | `fareApi.ts` fare rules/discount queries work | Run against test DB | ⏳ Pending test DB |
| **UI** | TouristPricesPage shows conflicting_data badge | Visual check in dev server | ✅ Code verified |
| **UI** | SourcesPage shows conflict `information_supported` | Visual check in dev server | ✅ Code verified |
| **UI** | DiscountsPage lists all 4 discount types | Visual check in dev server | ⏳ Pending test DB |
| **UI** | FareChecker handles single discount selection | Code review | ✅ Architecture verified |
| **Build** | `npm run build` succeeds | Run build | ⏳ Pending test DB env vars |

**Note:** Application compatibility tests require a running dev server pointing at the test database. Update `.env.local` with test DB credentials:

```env
VITE_SUPABASE_URL=http://localhost:5433  # or use Supabase dev project URL
VITE_SUPABASE_ANON_KEY=your_test_anon_key  # generate for test DB
```

---

## 9. Blocker Checklist (Must Clear Before Execution)

| Blocker | Status | Resolution |
|---------|--------|------------|
| Production Supabase project accidentally targeted | ⚠️ **CRITICAL** | **Explicit confirmation** that test DB is isolated (local Docker or separate Supabase project) |
| Migration 03 lacks unique constraint for standard ON CONFLICT | ✅ **ADDRESSED** | Uses advisory lock + exact-match check — valid alternative pattern |
| Migration 04 record-count discrepancy | ✅ **RESOLVED** | 4 records confirmed correct (3 statutory + 1 promo) |
| Museo conflict prices bypassing uniqueness | ✅ **RESOLVED** | Distinct `item_name` values allow both under `(location_id, establishment_name, item_name)` |
| No Supabase dev project configured | ⏳ **OPTIONAL** | Local PostgreSQL sufficient for Phase 1–3; Supabase dev project for Phase 5–6 |
| Application env vars not set for test DB | ⏳ **PENDING** | Requires `.env.local` update before Phase 5 |

---

## 10. Go/No-Go Decision Criteria

### **GO** (Proceed to test execution) if:
- [ ] User explicitly confirms target database (local PostgreSQL Docker or Supabase dev project)
- [ ] User confirms "Do not execute against production Supabase"
- [ ] Docker/PostgreSQL available for local test

### **NO-GO** (Do not proceed) if:
- [ ] Any ambiguity about target database identity
- [ ] Production Supabase credentials would be used
- [ ] Required tooling (psql, Docker) unavailable

---

## 11. Next Steps After Test Execution

1. **If all tests PASS:** Document results, clear Migration 07 for audit
2. **If any test FAILS:** Diagnose, fix migration, re-run from Phase 1
3. **After local PostgreSQL validation:** Optional Supabase dev project test for RLS/Auth/Realtime parity
4. **Only after full integration validation:** Consider production deployment (separate approval process)

---

## 12. Appendix: Complete Record Inventory for Test Validation

### Sources (18)
- 17 × `verified` — PTV, PIA, PCO, SunStar, LRTA (3), DOTr (2), Lawphil (3), Intramuros (3), National Museum, GMA News, LTFRB, LRMC (2)
- 1 × `conflicting_data` — Intramuseum Museum Guide [14]

### Transport Types (27)
- 5 × Jeepney/Bus (Metro Manila)
- 5 × Provincial Bus classes
- 4 × Taxi classes
- 4 × TNVS classes
- 2 × UV Express
- 1 × P2P Bus, 1 × Tricycle, 1 × Motorcycle Taxi
- 3 × Rail (MRT-3, LRT-1, LRT-2)
- 1 × Ferry

### Fare Rules (9) — All `check_source`, effective 2026-09-28
- Traditional Jeepney, Modern Jeepney, Ordinary City Bus, A/C City Bus, EDSA Busway
- Provincial Bus: Ordinary, A/C, Deluxe, Super Deluxe, Luxury

### Discount Types (4) — All `verified`
- Student (RA 11314), Senior (RA 9994), PWD (RA 10754), MRT-3/LRT-2 50% Promo

### Locations (5) — All Manila, Metro Manila, active
- Fort Santiago, Casa Manila Museum, Centro de Turismo Intramuros, National Museum Complex, Museo de Intramuros

### Tourism Prices (6)
- 4 × `verified`: Fort Santiago, Casa Manila, Centro de Turismo, National Museum (FREE)
- 2 × `conflicting_data`: Museo de Intramuros (two distinct item_names, two sources)

---

**Plan Complete.** Awaiting your explicit approval to proceed with test database setup and migration execution.

**Do not proceed to Migration 07** until this integration test plan is executed and all tests pass.