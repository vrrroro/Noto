import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data and exposes explicit loading / success / error states so a page
 * never shows a blank screen. `setData` allows local updates after a mutation.
 */
export function useResource(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const requestId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, status: prev.data ? 'success' : 'loading', error: null }));
    try {
      const data = await loaderRef.current();
      if (id === requestId.current) setState({ status: 'success', data, error: null });
    } catch (error) {
      if (id === requestId.current) setState({ status: 'error', data: null, error });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setData = useCallback((update) => {
    setState((prev) => ({ ...prev, data: typeof update === 'function' ? update(prev.data) : update }));
  }, []);

  return { ...state, reload, setData };
}
