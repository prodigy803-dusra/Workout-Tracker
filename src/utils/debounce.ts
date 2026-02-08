/**
 * useDebouncedCallback — delays invoking `fn` until `delayMs` ms have elapsed
 * since the last call. Useful for search inputs and auto-save.
 */
import { useRef, useCallback } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fnRef.current(...args);
    }, delayMs);
  }, [delayMs]) as (...args: Parameters<T>) => void;
}
