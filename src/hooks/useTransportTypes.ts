import { useState, useEffect, useCallback } from 'react';
import { fetchTransportTypes } from '../api/fareApi';
import type { TransportType } from '../types';

export function useTransportTypes() {
  const [data, setData] = useState<TransportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransportTypes();
      setData(result);
    } catch {
      setError('Failed to load transportation types. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, retry: load };
}
