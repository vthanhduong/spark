import { useEffect, useRef, useState } from 'react';

/**
 * Throttles a value update to a specified delay in milliseconds
 * @param value - The value to throttle
 * @param delay - Delay in milliseconds (0 means no throttle)
 * @returns Throttled value
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If no delay, return early and let state update naturally
    if (delay === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Use microtask to avoid warning
      queueMicrotask(() => setThrottledValue(value));
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule update
    timeoutRef.current = setTimeout(() => {
      setThrottledValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
}
