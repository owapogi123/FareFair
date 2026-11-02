# Farefair V1.4 — Migration 04 Discount Types Audit

**Date:** 2026-10-29
**Auditor:** Senior PostgreSQL Database Engineer / Supabase Architect
**Status:** PASS WITH CORRECTIONS APPLIED

---

## 1. Executive Summary

Audited `supabase/migrations/20261028_04_discount_types.sql` against:
- `supabase/schema.sql` (discount_types table DDL)
- Migration 01 (sources) and Migration 02 (transport_types) dependencies
- Philippine legal statutes: RA 11314 (Student), RA 9994 (Senior), RA 10754 (PWD)
- DOTr/LRTA 50% rail promotional program
- Application code: `src/api/fareApi.ts`, `src/services/fareService.ts`, `src/types/index.ts`

**Result:** Migration 04 is structurally sound and legally accurate. One structural correction applied (idempotency constraint). Three WARNINGS identified for production deployment consideration.

---

## 2. Schema Compatibility Check

### `discount_types` Table (from `supabase/schema.sql`)

| Column | Schema Definition | Migration Usage | Compatible |
|--------|-------------------|-----------------|------------|
| `id` | `uuid primary key default gen_random_uuid()` | Auto-generated | ✅ |
| `name` | `text not null` | All 4 inserts have names | ✅ |
| `description` | `text not null default ''` | All have descriptions | ✅ |
| `percentage` | `numeric(5,2) not null` | 20.00, 20.00, 20.00, 50.00 | ✅ |
| `eligibility` | `text not null default ''` | All populated | ✅ |
| `required_documents` | `text not null default ''` | All populated | ✅ |
| `citizenship_restrictions` | `text` nullable | Populated or NULL | ✅ |
| `legal_basis` | `text` nullable | All have legal basis | ✅ |
| `applicable_transports` | `text[]` nullable | UUID arrays (FK to transport_types) | ✅ |
| `effective_from` | `date` nullable | All have dates | ✅ |
| `effective_until` | `date` nullable | All NULL (ongoing) | ✅ |
| `active` | `boolean not null default true` | All `true` | ✅ |
| `verification_status` | `text CHECK (...)` | All `'verified'` | ✅ |
| `source_id` | `uuid REFERENCES sources(id)` | Validated FK lookups | ✅ |
| `created_at` | `timestamptz not null default now()` | Auto-generated | ✅ |

**Schema Compatibility: PASS** ✅

---

## 3. Discount Records Analysis

### 3.1 Statutory Discounts (Permanent Laws)

| Discount | Law | Percentage | Eligibility | Citizenship | Transport Coverage |
|----------|-----|------------|-------------|-------------|-------------------|
| **Student Fare Discount** | RA 11314 (2019) | 20% | Filipino enrolled student (elem-HS-TVET-college), excludes post-grad, valid weekends/holidays | Filipino only | 16 types: Jeepneys, buses, UV Express, P2P, MRT-3, LRT-1, LRT-2 |
| **Senior Citizen Fare Discount** | RA 9994 (2010) | 20% | Filipino citizen 60+, resident, OSCA ID | Filipino resident only | 19 types: + taxis (regular, premium, airport) |
| **PWD Fare Discount** | RA 10754 (2016) | 20% (at least) | Filipino citizen with disability, NCWDP/MSWDO PWD ID | Filipino only | 23 types: + TNVS (all 4 classes) |

**Legal Accuracy Check:**

| Requirement | Student (RA 11314) | Senior (RA 9994) | PWD (RA 10754) |
|-------------|-------------------|------------------|----------------|
| 20% discount mandated | ✅ Sec 4 | ✅ Sec 5(a) | ✅ Sec 5(b) |
| Filipino citizenship required | ✅ Sec 3 | ✅ Sec 2 | ✅ Sec 2 |
| Specific ID required | ✅ School ID/enrollment | ✅ OSCA Senior ID | ✅ PWD ID (NCWDP) |
| Post-grad excluded | ✅ Sec 3 | N/A | N/A |
| Weekends/holidays included | ✅ Sec 4 | ✅ (general) | ✅ (general) |
| Non-stacking with promos | ⚠️ Not explicit in law | ⚠️ Not explicit in law | ✅ Sec 5(b) "non-stacking" |
| Transport coverage per law | "Public land transport" | "Public transport" | "Public transport" |

**Source References (Migration 01):**
- Student: Source [09] — `lawphil.net/.../ra_11314_2019.html` — `verified`
- Senior: Source [10] — `lawphil.net/.../ra_9994_2010.html` — `verified`
- PWD: Source [11] — `lawphil.net/.../ra_10754_2016.html` — `verified`

**Statutory Discounts: PASS** ✅

### 3.2 Temporary Promotional Discount

| Discount | Source | Percentage | Eligibility | Transport Coverage | Stacking |
|----------|--------|------------|-------------|-------------------|----------|
| **MRT-3 / LRT-2 50% Promotional Fare** | LRTA Citizens Charter [06] + DOTr MRT-3 Charter [07] + GMA News [16] | 50% | All passengers, no ID required | MRT-3, LRT-2 only | **Explicitly non-stackable** with statutory 20% |

**Legal Basis:** DOTr Memorandum / LRTA Citizens Charter 2026 / DOTr MRT-3 Citizens Charter 2026
**Effective:** 2026-03-23 until further notice
**Source:** [05] LRTA official website (tickets-and-fares) + [16] GMA News corroboration

**Promotional Discount: PASS** ✅

---

## 4. Stacking / Combination Analysis

### Current Migration Design

The migration **correctly separates** statutory vs promotional:

```sql
-- Statutory: legal_basis = 'Republic Act No. XXXX'
-- Promotional: legal_basis = 'DOTr Memorandum / LRTA Citizens Charter...'
```

**Stacking Prevention in Description Fields:**
- Promotional discount description: *"Cannot be combined with Student, Senior, or PWD 20% discounts for the same trip."*
- Statutory discounts: No stacking language (laws don't explicitly prohibit, but DOTr guidance does)

**Application Code Check (`src/services/fareService.ts`):**
```typescript
// Current implementation applies ONE discount only (discount_applied is single DiscountType)
// calculateFare() accepts single discount parameter
// No stacking logic exists
```

**Critical Finding:** The application **does not support discount stacking**. The migration's design (single discount per fare calculation) matches the app. However:

| Scenario | Current Behavior | Required? |
|----------|------------------|-----------|
| Senior + Promo (MRT-3) | Would apply only one (whichever selected) | ✅ Correct — non-stackable |
| Student + PWD (same person) | Only one can be selected in UI | ✅ Correct — mutually exclusive eligibility |
| PWD + Promo | Only one applied | ✅ Correct — non-stackable per RA 10754 |

**Stacking Analysis: PASS** — Design correctly prevents stacking by architecture (single discount selection).

---

## 5. Idempotency & Duplicate Prevention

### Original Migration Approach
```sql
INSERT INTO discount_types (...) VALUES (...)
ON CONFLICT DO NOTHING;
```

### Schema Check
**No UNIQUE constraint on `discount_types` table** in `schema.sql`.

| Column | Unique Constraint? |
|--------|-------------------|
| `name` | ❌ No |
| `(name, effective_from)` | ❌ No |
| Any business key | ❌ No |

**Result:** `ON CONFLICT DO NOTHING` **will never trigger** — duplicates will be inserted on re-run.

**This is the same issue as Migration 03 original.**

### Migration 01 & 02 Comparison
- Migration 01 (sources): ✅ Adds `UNIQUE (organization, title, url)` before INSERT
- Migration 02 (transport_types): ✅ Adds `UNIQUE (name)` before INSERT
- Migration 04 (discount_types): ❌ **Missing unique constraint**

### Correction Applied

Added to migration file before INSERT block:

```sql
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
```

And changed INSERT to:
```sql
ON CONFLICT (name) DO UPDATE SET
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
```

**Idempotency: FIXED** ✅

---

## 6. Foreign Key Validation

### Source IDs (Migration 01 → Migration 04)
```sql
SELECT id INTO src_ra11314 FROM sources WHERE url LIKE '%lawphil.net/statutes/repacts/ra2019/ra_11314_2019.html%' LIMIT 1;
SELECT id INTO src_ra9994 FROM sources WHERE url LIKE '%lawphil.net/statutes/repacts/ra2010/ra_9994_2010.html%' LIMIT 1;
SELECT id INTO src_ra10754 FROM sources WHERE url LIKE '%lawphil.net/statutes/repacts/ra2016/ra_10754_2016.html%' LIMIT 1;
SELECT id INTO src_rail_promo FROM sources WHERE url LIKE '%lrta.gov.ph/tickets-and-fares/%' LIMIT 1;
SELECT id INTO src_gma_news FROM sources WHERE url LIKE '%gmanetwork.com/news/topstories/nation/980582%' LIMIT 1;
```

All 5 source URLs exist in Migration 01 with exact matches. ✅

### Transport Type IDs (Migration 02 → Migration 04)
All 27 transport types referenced in `applicable_transports` arrays exist in Migration 02 with exact name matches. ✅

**Foreign Keys: PASS** ✅

---

## 7. Verification Status & Provisional Data Check

| Discount | Verification Status | Source Verification | Assessment |
|----------|---------------------|---------------------|------------|
| Student | `verified` | Source [09] = `verified` | ✅ Law is permanent |
| Senior | `verified` | Source [10] = `verified` | ✅ Law is permanent |
| PWD | `verified` | Source [11] = `verified` | ✅ Law is permanent |
| MRT-3/LRT-2 50% Promo | `verified` | Source [05] = `verified`, [16] = `verified` | ⚠️ **Promotional — time-limited** |

**Warning:** The promotional discount is marked `verified` (source is verified) but the **discount itself is temporary** ("until further notice"). The migration correctly:
- Sets `effective_from = '2026-03-23'`
- Leaves `effective_until = NULL` (unknown end date)
- Documents non-stacking in description

**However:** Application must check `effective_until` and potentially expire this discount when DOTr announces end. No automatic expiration mechanism exists.

**Verification Status: PASS with WARNING** ⚠️

---

## 8. Application Compatibility

### API (`src/api/fareApi.ts`)
```typescript
export async function fetchDiscountTypes(): Promise<DiscountType[]> {
  // Selects all active discount_types with source join
  .eq('active', true)
```
→ Will fetch all 4 discounts correctly.

```typescript
export async function fetchDiscountById(id: string): Promise<DiscountType | null> {
  // Used by FareChecker to get full discount object
}
→ Compatible.
```

### Fare Service (`src/services/fareService.ts`)
```typescript
// calculateFare() accepts single discount: DiscountType | null
// Uses discount.percentage for calculation
// Applies rounding after discount
```
→ Compatible with all 4 discount records.

### TypeScript Types (`src/types/index.ts`)
```typescript
export interface DiscountType {
  id: string;
  name: string;
  percentage: number;  // non-nullable
  applicable_transports: string[] | null;  // UUID strings
  // ...
}
```
→ All 4 records provide non-null percentage, valid UUID arrays.

### UI Pages
- **DiscountsPage.tsx** — Lists all active discounts (will show 4)
- **FareChecker (CheckFarePage)** — Step 4 lets user select one discount
- **FareResultCard** — Shows discount_applied and discount_amount

**Application Compatibility: PASS** ✅

---

## 9. Mandatory Requirements Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 1. No mock/fabricated discounts | ✅ | All from official laws/regulations |
| 2. Legal references accurate | ✅ | RA 11314, RA 9994, RA 10754, DOTr memo |
| 3. Percentages correct | ✅ | 20% statutory, 50% promo per sources |
| 4. Eligibility per law | ✅ | Citizenship, age, enrollment, disability |
| 5. ID requirements per law | ✅ | School ID, OSCA ID, PWD ID (NCWDP) |
| 6. Transport coverage accurate | ✅ | Matches "public land transport" scope |
| 7. Statutory vs promotional separated | ✅ | Different legal_basis, descriptions |
| 8. Non-stacking documented | ✅ | Promo description explicit |
| 9. Provisional/expired not presented as current | ✅ | All active, laws permanent, promo has effective_from |
| 10. Source traceability | ✅ | All 4 link to verified sources |
| 11. No unsupported assumptions | ✅ | No invented discounts |
| 12. Discount calc doesn't apply to ineligible transport | ✅ | `applicable_transports` arrays match law scope |

**Requirements: PASS** ✅

---

## 10. Outstanding Issues & Warnings

### FIXED (Applied to Migration)

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | **No unique constraint on discount_types** | Added `UNIQUE (name)` constraint + `ON CONFLICT (name) DO UPDATE` |

### REMAINING WARNINGS (For Production Deployment)

| # | Issue | Severity | Mitigation |
|---|-------|----------|------------|
| 2 | **Source lookup uses URL pattern matching** | HIGH | Fragile if URLs change; consider adding UNIQUE constraint on `sources.url` |
| 3 | **Promotional discount `effective_until = NULL`** | MEDIUM | No automatic expiry when DOTr ends promo; app must monitor DOTr announcements |
| 4 | **No `check_source` for promotional** | MEDIUM | Promo marked `verified` but is time-limited; acceptable — source is verified, but app should treat promo as conditional |

---

## 11. Static Validation Tests Executed

| Test | Method | Result |
|------|--------|--------|
| Schema column mapping | Cross-referenced all 14 columns | ✅ PASS |
| Foreign key references (sources) | Verified 5 source URLs in Migration 01 | ✅ PASS |
| Foreign key references (transport_types) | Verified 27 transport names in Migration 02 | ✅ PASS |
| Verification status enum | All `'verified'` valid per CHECK constraint | ✅ PASS |
| Legal statute accuracy | Cross-referenced RA 11314, RA 9994, RA 10754 | ✅ PASS |
| Percentage accuracy | 20% statutory, 50% promo per sources | ✅ PASS |
| Idempotency analysis | Now has unique constraint + ON CONFLICT DO UPDATE | ✅ PASS (FIXED) |
| Stacking prevention | Architecture (single discount) + promo description | ✅ PASS |
| Application compatibility | API, service, types, UI pages checked | ✅ PASS |
| Provisional data check | No provisional discounts inserted | ✅ PASS |

**Tests: 10 PASS**

---

## 12. Deliverables

### 12.1 Corrected Migration 04
**Saved to:** `supabase/migrations/20261028_04_discount_types.sql` (updated in-place with idempotency fix)

### 12.2 Files Modified
- `supabase/migrations/20261028_04_discount_types.sql` — Added unique constraint and ON CONFLICT DO UPDATE

### 12.3 Summary of Corrections
1. Added `discount_types_name_key` UNIQUE constraint on `name` column
2. Changed `ON CONFLICT DO NOTHING` → `ON CONFLICT (name) DO UPDATE SET ...` to preserve UUIDs on re-run
3. All other content unchanged — legally accurate and schema-compatible

### 12.4 Verification Evidence
Documented in Sections 3-8 above.

### 12.5 Remaining Risks
Documented in Section 10 — 1 HIGH, 2 MEDIUM warnings.

### 12.6 Tests Actually Executed
10 static analysis tests (Section 11). No database execution.

---

## 13. Final Verdict

### **PASS WITH WARNINGS**

Migration 04 is **ready for isolated test database deployment** with the idempotency fix applied.

**Required before test deploy:** None — fix already applied.

**Do not proceed to Migration 05** until:
- Test database deployment confirms zero duplicates on re-run
- Application integration verified for all 4 discount types
- Promotional discount expiry handling reviewed with product team

---

## 14. Appendix: Corrected Migration Content

The corrected migration file now contains:

```sql
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
-- ... [rest unchanged - 4 discount inserts with ON CONFLICT (name) DO UPDATE]
```

**Audit Complete.** No production SQL executed. Ready for your review.