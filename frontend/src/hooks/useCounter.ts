import { useState, useCallback, useEffect } from 'react';
import { getCounterState, increment as sdkIncrement } from '../lib/midnight-client';

// ---------------------------------------------------------------------------
// Deployed contract address on Midnight Preprod
// ---------------------------------------------------------------------------
const CONTRACT_ADDRESS =
  '749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d';

// ---------------------------------------------------------------------------
// Hook interface
// ---------------------------------------------------------------------------

export interface UseCounter {
  counter: bigint | null;
  loading: boolean;
  error: string | null;
  txHash: string | null;
  increment: (witness: bigint, walletProvider?: unknown, accountId?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// useCounter
// ---------------------------------------------------------------------------

export function useCounter(): UseCounter {
  const [counter, setCounter] = useState<bigint | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await getCounterState(CONTRACT_ADDRESS);
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
    async (witness: bigint, walletProvider?: unknown, accountId?: string) => {
      if (witness <= 0n) {
        setError('Witness value must be greater than 0.');
        return;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const result = await sdkIncrement(
          CONTRACT_ADDRESS,
          witness,
          walletProvider,
          accountId ?? '',
        );
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

  // Load counter state on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { counter, loading, error, txHash, increment, refresh };
}
