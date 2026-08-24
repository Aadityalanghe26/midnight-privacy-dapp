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

function isWalletAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).midnight;
}

export function useWallet(): UseWallet {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_STATE);

  const connect = useCallback(async () => {
    if (!isWalletAvailable()) {
      setWallet({ status: 'error', address: null, error: 'Lace wallet extension not installed' });
      return;
    }

    setWallet({ status: 'connecting', address: null, error: null });
    try {
      const api = await (window as any).midnight.enable();
      const address = await api.getAddress();
      setWallet({ status: 'connected', address, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet connection was declined';
      setWallet({ status: 'error', address: null, error: message });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ ...INITIAL_STATE });
  }, []);

  return { wallet, connect, disconnect };
}
