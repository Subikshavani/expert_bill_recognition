import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";

/**
 * Fetches data from the API and returns { data, loading, error, refetch }.
 * Re-fetches automatically if path changes.
 */
export function useApi(path) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(path);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
