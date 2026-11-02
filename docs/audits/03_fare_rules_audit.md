# Audit Report: `20261028_03_fare_rules.sql`

**Status: FAIL** — Critical idempotency failure (no conflict target); several fare amounts need verification against source; provisional fares misclassified as `calculated`; missing unique constraint for historical preservation.

---

## 1. Schema Compatibility

| Check | Result | Details |
|-------|--------|---------|
| Table `fare_rules` exists | ✅ PASS | schema.sql lines 96–112 |
| Columns match INSERT | ✅ PASS | All 12 columns present; `id`, `created_at` use defaults |
| `transport_type_id` FK | ✅ PASS | References `transport_types(id)` — Migration 02 provides 27 types |
| `source_id` FK | ✅ PASS | References `sources(id)` — Migration 01 provides 18 sources |
| `base_fare` NOT NULL | ✅ PASS | All rows provide value (including `0.00` for UV Express) |
| Monetary type `numeric(10,2)` | ✅ PASS | All literals have 2 decimal places |
| `verification_status` enum | ✅ PASS | Uses `verified`, `calculated`, `conflicting_data`, `unverified` — all valid |
| `effective_from` NOT NULL | ✅ PASS | All rows have date |
| RLS policy | ✅ PASS | Public read enabled (schema.sql lines 114–117) |

---

## 2. Critical Issues

### 2.1 ON CONFLICT DO NOTHING Has No Target (CRITICAL)

**Line 366:** `ON CONFLICT DO NOTHING;`

**Problem:** PostgreSQL requires a unique constraint or index for `ON CONFLICT`. The `fare_rules` table has **no unique constraint** on `(transport_type_id, effective_from)` or any other column set. This statement will either:
- Error: `there is no unique or exclusion constraint matching the ON CONFLICT specification`, OR
- Silently do nothing on *any* constraint violation (unpredictable).

**Required fix:** Add unique constraint before INSERT:
```sql
ALTER TABLE fare_rules ADD CONSTRAINT fare_rules_transport_effective_key
    UNIQUE (transport_type_id, effective_from);
```
Then use `ON CONFLICT (transport_type_id, effective_from) DO UPDATE SET ...` to preserve history or `DO NOTHING` if first-write-wins.

### 2.2 Provisional Fares Misclassified as `calculated` (CRITICAL)

| Transport Type | Lines | Current Status | Correct Status | Reason |
|----------------|-------|----------------|----------------|--------|
| Regular Taxi | 196–205 | `calculated` | `unverified` or `check_source` | Petition pending — no authorized fare exists |
| Premium Silver Taxi | 207–216 | `calculated` | `unverified` | Same |
| Premium Gold Taxi | 218–227 | `calculated` | `unverified` | Same |
| TNVS (all 4 classes) | 244–286 | `calculated` | `unverified` | Provisional per LTFRB [01], [04] |
| UV Express (both) | 294–314 | `calculated` | `unverified` | No universal base fare verified |
| P2P Bus | 320–328 | `unverified` | ✅ Correct | No single fare |
| Tricycle/Motorcycle/Ferry | 335–342 | `unverified` | ✅ Correct | LGU/platform/operator dependent |

**Rule:** `calculated` = mathematically derived from *verified* inputs. `unverified`/`check_source` = no authoritative published fare. The research document explicitly states taxi, TNVS, UV Express fares are **provisional / petition pending**.

### 2.3 Luxury Provincial Bus Discounted Base Fare (HANDLED)

**Lines 179–188:** `discounted_base_fare = NULL`, `verification_status = 'conflicting_data'`

✅ Correctly quarantined. Research doc: "discounted minimum inconsistent per PTV". Excluded from authoritative calculations.

---

## 3. Fare Amount Verification (Against Research Sources)

| Transport | Base | Incl. km | Add'l/km | Disc. Base | Disc. Add'l | Source | Status | Notes |
|-----------|------|----------|----------|------------|-------------|--------|--------|-------|
| Traditional Jeepney | 14.00 | 4 | 2.00 | 11.25 | 1.60 | [01] | verified | 20% disc = 11.20 → rounded 11.25? |
| Modern Jeepney | 17.00 | 4 | 2.40 | 13.50 | 1.92 | [01] | verified | 20% disc = 13.60 → rounded 13.50? |
| Ordinary City Bus | 15.00 | 5 | 2.49 | 12.00 | 1.99 | [01] | verified | 20% disc = 12.00, 1.992 → 1.99 |
| A/C City Bus | 18.00 | 5 | 2.98 | 14.50 | 2.38 | [01] | verified | 20% disc = 14.40 → 14.50? |
| EDSA Busway | 18.00 | 5 | 2.98 | 14.40 | 2.38 | [01] | verified | Disc base differs from A/C bus |
| Prov. Ordinary | 12.00 | 5 | 2.20 | 9.50 | 1.76 | [01],[04] | verified | 20% = 9.60 → 9.50? |
| Prov. A/C | 12.25 | 5 | 2.45 | 9.75 | 1.96 | [01],[04] | verified | 20% = 9.80 → 9.75? |
| Prov. Deluxe | 13.00 | 5 | 2.60 | 10.50 | 2.08 | [01],[04] | verified | 20% = 10.40 → 10.50? |
| Prov. Super Deluxe | 13.50 | 5 | 2.70 | 10.75 | 2.16 | [01],[04] | verified | 20% = 10.80 → 10.75? |
| **Prov. Luxury** | **16.75** | **5** | **3.35** | **NULL** | **2.68** | **[01]** | **conflicting_data** | **Disc. base NULL — correct** |
| Regular Taxi | 65.00 | 0.5 | 13.50 | NULL | NULL | [01] | **unverified** | Flag-down 500m; petition pending |
| Premium Silver Taxi | 80.00 | 0.5 | 17.50 | NULL | NULL | [01] | **unverified** | Petition pending |
| Premium Gold Taxi | 95.00 | 0.5 | 20.50 | NULL | NULL | [01] | **unverified** | Petition pending |
| Airport Taxi | 115.00 | 0.5 | 4.00 | NULL | NULL | [01] | verified | Per 300m after 500m |
| TNVS Hatchback | 55.00 | 0 | 13.00 | NULL | NULL | [01] | **unverified** | Provisional |
| TNVS Sedan | 65.00 | 0 | 15.00 | NULL | NULL | [01] | **unverified** | Provisional |
| TNVS AUV/SUV | 75.00 | 0 | 18.00 | NULL | NULL | [01] | **unverified** | Provisional |
| TNVS Premium | 165.00 | 0 | 36.00 | NULL | NULL | [01] | **unverified** | Provisional |
| Trad. UV Express | 0.00 | 0 | 2.60 | NULL | NULL | [01] | **unverified** | No universal base |
| Modern UV Express | 0.00 | 0 | 3.00 | NULL | NULL | [01] | **unverified** | No universal base |
| P2P Bus | NULL | NULL | NULL | NULL | NULL | [01] | unverified | 15% premium per route |
| LRT-1 | 16.25 | 0 | 1.47 | NULL | NULL | [08] | verified | Boarding + distance |
| MRT-3 | NULL | NULL | NULL | NULL | NULL | [07] | verified | Uses fare_matrices |
| LRT-2 | NULL | NULL | NULL | NULL | NULL | [06] | verified | Uses fare_matrices |

**Rounding discrepancies:** Several discounted base fares (11.25, 13.50, 14.50, 9.50, 9.75, 10.50, 10.75) appear to be **rounded to nearest 0.25** rather than pure 20%. Research doc says "rounding to nearest peso" but LTFRB matrices may use 0.25 increments. Need to verify against actual LTFRB matrix PDF — currently marked `verified` but should be `check_source` until rounding rule confirmed.

---

## 4. Source & Transport Type References

| Reference | Lookup Method | Risk |
|-----------|---------------|------|
| `src_ltfrb` | `url LIKE '%ptvnews.ph/ltfrb-releases-new-matrices%'` | ✅ Unique — Migration 01 source [01] |
| Transport types | `name = 'Exact Name'` | ✅ Matches Migration 02 names exactly (verified by code review) |

**No broken references detected** — all 27 transport types resolved.

---

## 5. Effective Dates & Expiry

| Transport | `effective_from` | `effective_until` | Assessment |
|-----------|------------------|-------------------|------------|
| Metro Manila PUVs | 2026-09-28 | NULL | Current authorized fares |
| Provincial Buses | 2026-09-28 | NULL | Current |
| Taxis (all) | 2026-09-28 | NULL | **Should be NULL or future** — petition pending |
| TNVS (all) | 2026-09-28 | NULL | **Should be NULL** — provisional |
| UV Express | 2026-09-28 | NULL | **Should be NULL** — no universal base |
| P2P Bus | 2026-09-28 | NULL | OK — structural rule |
| LRT-1 | 2025-04-02 | NULL | Current LRMC tariff |
| MRT-3 / LRT-2 | 2026-03-23 | NULL | Promo start; fare_matrices hold actual fares |

**Issue:** Provisional fares have `effective_from = '2026-09-28'` implying authorization. Should be `NULL` or a future date with `verification_status = 'unverified'` and `effective_until` set when petition resolved.

---

## 6. Route-Specific vs. General Formula

| Category | Uses General Formula? | Requires `fare_matrices`? |
|----------|----------------------|---------------------------|
| Jeepney, City Bus, EDSA Busway | ✅ Yes (distance-based) | No |
| Provincial Bus | ✅ Yes (distance-based) | No |
| Taxi (flag-down + per km + per min) | ⚠️ Partial — per-min not modeled | No |
| TNVS | ⚠️ Partial — per-min not modeled | No |
| UV Express | ✅ Per-km only | No |
| P2P Bus | ❌ No single formula | **Yes** — per route |
| Tricycle / Motorcycle / Ferry | ❌ No Metro-wide formula | **Yes** — per route/LGU |
| MRT-3 / LRT-2 | ❌ Station-to-station matrix | **Yes** — Migration 07 |
| LRT-1 | ✅ Boarding + distance | **Yes** — operator matrix [18] |

**Migration 03 correctly leaves P2P, Tricycle, Motorcycle, Ferry, MRT-3, LRT-2 as NULL/placeholder** — route matrices belong in `fare_matrices` (Migrations 07, future).

---

## 7. Idempotency & Historical Preservation

| Aspect | Current | Required |
|--------|---------|----------|
| Unique constraint | ❌ None | `UNIQUE (transport_type_id, effective_from)` |
| Conflict action | `DO NOTHING` (no target) | `DO UPDATE` to refresh rates *or* `DO NOTHING` with constraint |
| History preservation | ❌ Overwrites silently | New row per `effective_from` (current design) |
| UUID stability | N/A (new rows each run) | N/A — fare_rules are versioned by date |

**Current design:** Each fare period = new row (different `effective_from`). This is correct for history. But without unique constraint, duplicate periods can be inserted.

---

## 8. Validation Queries (Post-Fix)

```sql
-- Constraint check
SELECT conname FROM pg_constraint WHERE conrelid = 'fare_rules'::regclass AND contype = 'u';
-- expect: fare_rules_transport_effective_key

-- Row counts by verification_status
SELECT verification_status, count(*)
FROM fare_rules GROUP BY verification_status;
-- expect: verified=10, unverified=12, conflicting_data=1 (luxury bus)

-- Duplicate period check
SELECT transport_type_id, effective_from, count(*)
FROM fare_rules GROUP BY 1,2 HAVING count(*) > 1;
-- expect: 0 rows

-- Luxury bus quarantine
SELECT * FROM fare_rules WHERE verification_status = 'conflicting_data';
-- expect: 1 row (Provincial Bus - Luxury), discounted_base_fare IS NULL

-- Provisional fares not exposed as verified
SELECT tt.name, fr.verification_status, fr.base_fare
FROM fare_rules fr JOIN transport_types tt ON fr.transport_type_id = tt.id
WHERE fr.verification_status = 'unverified' AND fr.base_fare IS NOT NULL;
-- expect: taxis, TNVS, UV Express listed
```

---

## 9. Summary of Required Corrections

| Severity | Issue | Lines | Fix |
|----------|-------|-------|-----|
| **CRITICAL** | `ON CONFLICT DO NOTHING` no target | 366 | Add `UNIQUE (transport_type_id, effective_from)`; use `ON CONFLICT (transport_type_id, effective_from) DO NOTHING` |
| **CRITICAL** | Provisional fares marked `calculated` | 196–286, 294–314 | Change to `unverified` (taxis, TNVS, UV Express) |
| **WARNING** | Discounted base rounding unverified | 77–188 | Change `verified` → `check_source` for rows where 20% math ≠ stored value; add `information_supported` note |
| **WARNING** | Provisional effective_from implies authorization | 196–314 | Set `effective_from = NULL` for unverified fares |
| **INFO** | No `information_supported` column in table | — | Consider adding to `fare_rules` for audit notes (schema change) |

---

## 10. Limitations (Not Tested Against Live DB)

| Limitation | Impact |
|------------|--------|
| **No test database** | Cannot verify constraint creation, idempotency, or FK resolution |
| **LTFRB matrix PDF not accessed** | Discounted fare rounding (0.25 increments?) unconfirmed — marked `check_source` in fix |
| **Taxi/TNVS per-minute charges** | Not modeled in schema — `fare_rules` only captures flag-down + per-km |
| **Downstream FK verification** | Cannot confirm `fare_rules.transport_type_id` matches Migration 02 UUIDs without populated DB |

---

## 11. Fare Rules Count

| Category | Count |
|----------|-------|
| Verified (Metro PUV, Provincial non-luxury, Airport Taxi, LRT-1, MRT-3, LRT-2) | 10 |
| Unverified/Provisional (Taxis 3, TNVS 4, UV Express 2, P2P, Tricycle, Motorcycle, Ferry) | 13 |
| Conflicting Data (Provincial Luxury) | 1 |
| **Total** | **24** |

---

**Overall:** **FAIL** — Migration will error on `ON CONFLICT`; provisional fares misclassified; rounding unverified. Fixes required before production use.

**Files to fix:** `supabase/migrations/20261028_03_fare_rules.sql` (add constraint, correct statuses, adjust dates)