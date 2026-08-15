import { useState, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Mock internals — real SDK wiring comes in a later level
// ---------------------------------------------------------------------------

let _mockCounter: bigint = 0n;

async function mockGetCounter(): Promise<bigint> {
  // Simulate a short network delay
  await new Promise<void>((resolve) => setTimeout(resolve, 150));
  return _mockCounter;
}

async function mockIncrement(witness: bigint): Promise<bigint> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));
  _mockCounter += witness;
  return _mockCounter;
}

// ---------------------------------------------------------------------------
// Hook interface
// ---------------------------------------------------------------------------

export interface UseCounter {
  counter: bigint | null;
  loading: boolean;
  error: string | null;
  increment: (witness: bigint) => Promise<void>;
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// useCounter
// ---------------------------------------------------------------------------

export function useCounter(): UseCounter {
  const [counter, setCounter] = useState<bigint | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await mockGetCounter();
      setCounter(value);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch counter.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const increment = useCallback(
    async (witness: bigint) => {
      if (witness <= 0n) {
        setError('Witness value must be greater than 0.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const newValue = await mockIncrement(witness);
        setCounter(newValue);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to increment counter.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Load counter on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { counter, loading, error, increment, refresh };
}
