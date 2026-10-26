// Database entity types for FareFair
// All data is sourced from Supabase/PostgreSQL

export type VerificationStatus =
  | 'verified'
  | 'calculated'
  | 'check_source'
  | 'conflicting_data'
  | 'expired'
  | 'unverified';

export type PriceType =
  | 'official'
  | 'establishment_published'
  | 'estimated'
  | 'user_reported'
  | 'unverified';

export type SourceType =
  | 'government_document'
  | 'official_website'
  | 'news_article'
  | 'press_release'
  | 'regulatory_order'
  | 'law'
  | 'other';

export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'resolved'
  | 'dismissed';

// --- Transport Types ---
export interface TransportType {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Locations ---
export interface Location {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
}

// --- Routes ---
export interface Route {
  id: string;
  transport_type_id: string;
  transport_type?: TransportType;
  origin_location_id: string;
  origin_location?: Location;
  destination_location_id: string;
  destination_location?: Location;
  route_name: string;
  distance_km: number | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  created_at: string;
}

// --- Fare Rules ---
export interface FareRule {
  id: string;
  transport_type_id: string;
  transport_type?: TransportType;
  base_fare: number;
  included_distance_km: number;
  additional_rate_per_km: number;
  discounted_base_fare: number | null;
  discounted_additional_rate: number | null;
  rounding_rule: string | null;
  effective_from: string;
  effective_until: string | null;
  verification_status: VerificationStatus;
  source_id: string | null;
  source?: Source;
}

// --- Fare Matrix (route-specific fares) ---
export interface FareMatrix {
  id: string;
  route_id: string;
  route?: Route;
  fare_amount: number;
  discounted_fare_amount: number | null;
  verification_status: VerificationStatus;
  effective_from: string;
  effective_until: string | null;
  source_id: string | null;
  source?: Source;
}

// --- Discount Types ---
export interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage: number;
  eligibility: string;
  required_documents: string;
  citizenship_restrictions: string | null;
  legal_basis: string | null;
  applicable_transports: string[] | null;
  effective_from: string | null;
  effective_until: string | null;
  active: boolean;
  verification_status: VerificationStatus;
  source_id: string | null;
  source?: Source;
}

// --- Tourism Prices ---
export interface TourismPrice {
  id: string;
  category: string;
  establishment_name: string;
  item_name: string;
  price: number | null;
  discounted_price: number | null;
  price_type: PriceType;
  location_id: string | null;
  location?: Location;
  verification_status: VerificationStatus;
  checked_at: string | null;
  source_id: string | null;
  source?: Source;
}

// --- Sources ---
export interface Source {
  id: string;
  organization: string;
  title: string;
  url: string | null;
  source_type: SourceType;
  publication_date: string | null;
  effective_date: string | null;
  checked_at: string | null;
  information_supported: string | null;
  verification_status: VerificationStatus;
}

// --- Overcharge Reports ---
export interface OverchargeReport {
  id?: string;
  transport_type_id: string;
  origin_location_id: string | null;
  destination_location_id: string | null;
  expected_fare: number | null;
  charged_fare: number;
  difference: number | null;
  vehicle_plate: string | null;
  operator: string | null;
  driver_details: string | null;
  notes: string | null;
  occurred_at: string;
  status?: ReportStatus;
}

// --- Fare Check Result ---
export type FareStatus =
  | 'fare_matches'
  | 'possible_overcharge'
  | 'estimated_only'
  | 'data_not_available';

export interface FareCalculationResult {
  expected_fare: number | null;
  charged_fare: number;
  difference: number | null;
  status: FareStatus;
  transport_type: TransportType | null;
  fare_rule: FareRule | null;
  discount_applied: DiscountType | null;
  discount_amount: number | null;
  base_fare: number | null;
  distance_km: number | null;
  additional_distance: number | null;
  additional_amount: number | null;
  rounding_rule: string | null;
  verification_status: VerificationStatus;
  effective_from: string | null;
  effective_until: string | null;
  source: Source | null;
}

// --- Fare Check Form State ---
export interface FareCheckFormState {
  transport_type_id: string;
  origin_location_id: string;
  destination_location_id: string;
  discount_type_id: string;
  charged_fare: string;
}
