import { useState, useCallback } from 'react';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  error: string | null;
}

export interface UseWallet {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const INITIAL_STATE: WalletState = {
  status: 'disconnected',
  address: null,
  error: null,
};

export function useWallet(): UseWallet {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_STATE);

  const connect = useCallback(async () => {
    setWallet({ status: 'connecting', address: null, error: null });

    try {
      const midnightProvider = (window as unknown as Record<string, unknown>).midnight;

      if (!midnightProvider) {
        throw new Error(
          'Midnight wallet not found. Please install the Lace wallet extension.',
        );
      }

      const api = await (midnightProvider as { enable: () => Promise<{ getAddress: () => Promise<string> }> }).enable();
      const address = await api.getAddress();

      setWallet({ status: 'connected', address, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet.';
      setWallet({ status: 'error', address: null, error: message });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(INITIAL_STATE);
  }, []);

  return { wallet, connect, disconnect };
}
