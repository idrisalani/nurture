import { useCallback, useEffect, useRef, useState } from 'react';

/** Load data on mount / when deps change. Keeps the last good data while reloading. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = useCallback(async () => {
    setLoading(true); setFailed(false);
    try { const d = await fn(); if (alive.current) setData(d); }
    catch { if (alive.current) setFailed(true); }
    finally { if (alive.current) setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { data, loading, failed, reload: run, setData };
}
