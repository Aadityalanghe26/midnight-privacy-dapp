import { useState, useCallback, useEffect } from 'react';
import { getCounterState, increment as sdkIncrement } from '../lib/midnight-client';

export interface UseCounter {
  counter: bigint | null;
  loading: boolean;
  error: string | null;
  txHash: string | null;
  increment: (witness: bigint, walletApi: unknown) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCounter(): UseCounter {
  const [counter, setCounter] = useState<bigint | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await getCounterState();
      setCounter(value);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch counter state.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const increment = useCallback(
    async (witness: bigint, walletApi: unknown) => {
      if (witness <= 0n) {
        setError('Witness value must be greater than 0.');
        return;
      }
      setLoading(true);
      setError(null);
      setTxHash(null);
      try {
        const result = await sdkIncrement(witness, walletApi);
        setCounter(result.newValue);
        setTxHash(result.txHash);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to call increment circuit.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { counter, loading, error, txHash, increment, refresh };
}
