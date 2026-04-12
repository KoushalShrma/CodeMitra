import { useEffect, useMemo, useState } from 'react';

/**
 * Tracks elapsed time for the current app session.
 * @returns {{ elapsedMs: number, formatted: string }} Session timing details.
 */
export function useSessionTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const formatted = useMemo(() => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, [elapsedMs]);

  return { elapsedMs, formatted };
}
