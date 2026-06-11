import { useState, useEffect, useCallback, useRef } from 'react';
import { getTrainTiming, TrainTimingResponse } from '@/services/api';

const REFRESH_INTERVAL = 10_000; // 10 seconds

export function useTrainTiming(station: string | null) {
  const [data, setData] = useState<TrainTimingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (!station) return;
    if (!data) setLoading(true);
    try {
      const result = await getTrainTiming(station);
      setData(result);
      setError(null);
    } catch {
      setError('Could not fetch timing');
    } finally {
      setLoading(false);
    }
  }, [station]);

  useEffect(() => {
    setData(null);
    fetch();
    timerRef.current = setInterval(fetch, REFRESH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [station]);

  return { data, loading, error, refetch: fetch };
}
