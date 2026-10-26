import { useState, useEffect, useCallback } from 'react';
import { fetchTourismPrices } from '../api/dataApi';
import type { TourismPrice } from '../types';

export function useTourismPrices(category?: string) {
  const [data, setData] = useState<TourismPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTourismPrices(category);
      setData(result);
    } catch {
      setError('Failed to load price information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, retry: load };
}
