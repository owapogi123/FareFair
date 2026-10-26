import { useState, useEffect, useCallback } from 'react';
import { fetchDiscountTypes } from '../api/fareApi';
import type { DiscountType } from '../types';

export function useDiscountTypes() {
  const [data, setData] = useState<DiscountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDiscountTypes();
      setData(result);
    } catch {
      setError('Failed to load discount information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, retry: load };
}
