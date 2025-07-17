import { useEffect, useRef } from 'react';
import { pollingManager } from '../services/pollingManager';

/**
 * Custom hook for managing polling tasks
 * Automatically registers, starts, and cleans up polling when component unmounts
 */
export const usePolling = (
  key: string,
  callback: () => void | Promise<void>,
  interval: number,
  options?: {
    enabled?: boolean;
    executeImmediately?: boolean;
    minInterval?: number;
  }
) => {
  const callbackRef = useRef(callback);
  
  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  useEffect(() => {
    // Skip if disabled
    if (options?.enabled === false) {
      pollingManager.stop(key);
      return;
    }
    
    // Register with a wrapper that uses the current callback
    pollingManager.register(
      key,
      () => callbackRef.current(),
      interval,
      {
        executeImmediately: options?.executeImmediately,
        minInterval: options?.minInterval,
      }
    );
    
    // Start polling
    pollingManager.start(key);
    
    // Cleanup on unmount
    return () => {
      pollingManager.stop(key);
    };
  }, [key, interval, options?.enabled, options?.executeImmediately, options?.minInterval]);
  
  // Return control functions
  return {
    executeNow: () => pollingManager.executeNow(key),
    stop: () => pollingManager.stop(key),
    start: () => pollingManager.start(key),
  };
};