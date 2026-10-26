import { supabase } from '../lib/supabase';
import type { TransportType, Location, FareRule, DiscountType, FareMatrix, Route } from '../types';

// --- Transport Types ---
export async function fetchTransportTypes(): Promise<TransportType[]> {
  const { data, error } = await supabase
    .from('transport_types')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

// --- Locations ---
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('active', true)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('active', true)
    .order('name')
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

// --- Fare Rules ---
export async function fetchFareRuleForTransport(transportTypeId: string): Promise<FareRule | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('fare_rules')
    .select('*, source:sources(*)')
    .eq('transport_type_id', transportTypeId)
    .lte('effective_from', today)
    .or(`effective_until.is.null,effective_until.gte.${today}`)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// --- Routes ---
export async function searchRoutes(
  originId: string,
  destinationId: string,
  transportTypeId?: string
): Promise<Route[]> {
  let query = supabase
    .from('routes')
    .select(`
      *,
      transport_type:transport_types(*),
      origin_location:locations!routes_origin_location_id_fkey(*),
      destination_location:locations!routes_destination_location_id_fkey(*)
    `)
    .eq('origin_location_id', originId)
    .eq('destination_location_id', destinationId);

  if (transportTypeId) {
    query = query.eq('transport_type_id', transportTypeId);
  }

  const { data, error } = await query.order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function fetchFareMatrixForRoute(routeId: string): Promise<FareMatrix | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('fare_matrices')
    .select('*, source:sources(*)')
    .eq('route_id', routeId)
    .lte('effective_from', today)
    .or(`effective_until.is.null,effective_until.gte.${today}`)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// --- Discounts ---
export async function fetchDiscountTypes(): Promise<DiscountType[]> {
  const { data, error } = await supabase
    .from('discount_types')
    .select('*, source:sources(*)')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchDiscountById(id: string): Promise<DiscountType | null> {
  const { data, error } = await supabase
    .from('discount_types')
    .select('*, source:sources(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
