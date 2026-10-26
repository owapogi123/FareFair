import type {
  FareRule,
  DiscountType,
  FareCalculationResult,
  FareStatus,
  VerificationStatus,
} from '../types';

/**
 * Calculates the expected fare based on fare rules, distance, and discount.
 * All inputs come from the database — no hardcoded values here.
 */
export function calculateFare(params: {
  fareRule: FareRule;
  distanceKm?: number | null;
  discount?: DiscountType | null;
  chargedFare: number;
}): FareCalculationResult {
  const { fareRule, distanceKm, discount, chargedFare } = params;

  let baseFare: number;
  let additionalRate: number;
  let discountedBaseFare: number | undefined;

  if (discount && fareRule.discounted_base_fare != null) {
    baseFare = Number(fareRule.discounted_base_fare);
    additionalRate = Number(fareRule.discounted_additional_rate ?? fareRule.additional_rate_per_km);
    discountedBaseFare = baseFare;
  } else {
    baseFare = Number(fareRule.base_fare);
    additionalRate = Number(fareRule.additional_rate_per_km);
  }

  const includedKm = Number(fareRule.included_distance_km);

  let expectedFare: number;
  let additionalDistance: number | null = null;
  let additionalAmount: number | null = null;

  if (distanceKm != null) {
    additionalDistance = Math.max(0, distanceKm - includedKm);
    additionalAmount = additionalDistance * additionalRate;
    expectedFare = baseFare + additionalAmount;

    // Apply rounding if specified
    if (fareRule.rounding_rule === 'round_up') {
      expectedFare = Math.ceil(expectedFare);
    } else if (fareRule.rounding_rule === 'round_nearest') {
      expectedFare = Math.round(expectedFare);
    } else if (fareRule.rounding_rule === 'round_down') {
      expectedFare = Math.floor(expectedFare);
    }
  } else {
    // No distance provided — use base fare only
    expectedFare = baseFare;
  }

  // Discount amount (if discount was applied via percentage, not built-in discounted fare)
  let discountAmount: number | null = null;
  if (discount && fareRule.discounted_base_fare == null) {
    const regularFare = distanceKm != null
      ? Number(fareRule.base_fare) + Math.max(0, distanceKm - includedKm) * Number(fareRule.additional_rate_per_km)
      : Number(fareRule.base_fare);
    discountAmount = regularFare * (Number(discount.percentage) / 100);
    expectedFare = regularFare - discountAmount;
    if (fareRule.rounding_rule === 'round_up') expectedFare = Math.ceil(expectedFare);
    else if (fareRule.rounding_rule === 'round_nearest') expectedFare = Math.round(expectedFare);
  }

  const difference = chargedFare - expectedFare;

  let status: FareStatus;
  if (Math.abs(difference) < 0.01) {
    status = 'fare_matches';
  } else if (difference > 0) {
    status = 'possible_overcharge';
  } else {
    // Charged less than expected — still show result
    status = 'fare_matches';
  }

  // Determine if we have a verified result or calculated
  const verificationStatus: VerificationStatus =
    distanceKm == null ? 'calculated' : fareRule.verification_status;

  return {
    expected_fare: expectedFare,
    charged_fare: chargedFare,
    difference: parseFloat(difference.toFixed(2)),
    status,
    transport_type: fareRule.transport_type ?? null,
    fare_rule: fareRule,
    discount_applied: discount ?? null,
    discount_amount: discountAmount ?? (discountedBaseFare != null ? Number(fareRule.base_fare) - discountedBaseFare : null),
    base_fare: baseFare,
    distance_km: distanceKm ?? null,
    additional_distance: additionalDistance,
    additional_amount: additionalAmount,
    rounding_rule: fareRule.rounding_rule,
    verification_status: verificationStatus,
    effective_from: fareRule.effective_from,
    effective_until: fareRule.effective_until,
    source: fareRule.source ?? null,
  };
}

/**
 * Calculates using a specific route fare matrix value.
 */
export function calculateFareFromMatrix(params: {
  matrixFare: number;
  discountedMatrixFare?: number | null;
  discount?: DiscountType | null;
  chargedFare: number;
  verificationStatus: VerificationStatus;
  effectiveFrom: string;
  effectiveUntil?: string | null;
}): Partial<FareCalculationResult> {
  const { matrixFare, discountedMatrixFare, discount, chargedFare, verificationStatus, effectiveFrom, effectiveUntil } = params;

  let expectedFare: number;
  if (discount && discountedMatrixFare != null) {
    expectedFare = Number(discountedMatrixFare);
  } else {
    expectedFare = Number(matrixFare);
  }

  const difference = chargedFare - expectedFare;
  let status: FareStatus;
  if (Math.abs(difference) < 0.01) {
    status = 'fare_matches';
  } else if (difference > 0) {
    status = 'possible_overcharge';
  } else {
    status = 'fare_matches';
  }

  return {
    expected_fare: expectedFare,
    charged_fare: chargedFare,
    difference: parseFloat(difference.toFixed(2)),
    status,
    verification_status: verificationStatus,
    effective_from: effectiveFrom,
    effective_until: effectiveUntil ?? null,
  };
}

export function formatPeso(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `₱${amount.toFixed(2)}`;
}

export function formatDifference(difference: number | null | undefined): string {
  if (difference == null) return '—';
  if (difference === 0) return 'No difference';
  const abs = Math.abs(difference);
  return difference > 0 ? `₱${abs.toFixed(2)} more` : `₱${abs.toFixed(2)} less`;
}
