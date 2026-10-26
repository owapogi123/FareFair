import { useState, useEffect, useCallback } from 'react';
import { fetchSources } from '../api/dataApi';
import type { Source } from '../types';

export function useSources(category?: string) {
  const [data, setData] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSources(category);
      setData(result);
    } catch {
      setError('Failed to load sources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, retry: load };
}
