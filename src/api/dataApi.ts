import { supabase } from '../lib/supabase';
import type { TourismPrice, Source, OverchargeReport } from '../types';

// --- Tourism Prices ---
export async function fetchTourismPrices(category?: string): Promise<TourismPrice[]> {
  let query = supabase
    .from('tourism_prices')
    .select('*, location:locations(*), source:sources(*)')
    .order('establishment_name');

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// --- Sources ---
export async function fetchSources(category?: string): Promise<Source[]> {
  let query = supabase
    .from('sources')
    .select('*')
    .order('checked_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('source_type', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// --- Report Overcharge ---
export async function submitOverchargeReport(
  report: Omit<OverchargeReport, 'id' | 'status'>
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('overcharge_reports')
    .insert([report])
    .select('id')
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function uploadEvidenceFile(
  reportId: string,
  file: File
): Promise<string> {
  const filePath = `evidence/${reportId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from('evidence_files').insert([{
    report_id: reportId,
    storage_path: filePath,
    file_name: file.name,
    file_size_bytes: file.size,
    mime_type: file.type,
  }]);
  if (dbError) throw dbError;

  return filePath;
}
