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

async function getLaceAPI(): Promise<any> {
  const w = window as any;
  if (w?.midnight?.mnLace) return await w.midnight.mnLace.enable();
  if (w?.midnight?.enable) return await w.midnight.enable();
  if (w?.midnight) return w.midnight;
  return null;
}

async function getAddress(api: any): Promise<string> {
  if (typeof api?.getAddress === 'function') return await api.getAddress();
  if (typeof api?.coinPublicKey === 'string') return api.coinPublicKey;
  if (api?.coinPublicKey) return String(api.coinPublicKey);
  if (typeof api?.getUnshieldedAddress === 'function') return await api.getUnshieldedAddress();
  return 'connected';
}

export function useWallet(): UseWallet {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_STATE);

  const connect = useCallback(async () => {
    setWallet({ status: 'connecting', address: null, error: null });
    try {
      const w = window as any;
      if (!w?.midnight) throw new Error('Lace wallet not found. Install Lace and enable Midnight.');
      const api = await getLaceAPI();
      if (!api) throw new Error('Could not connect to Lace Midnight connector.');
      const address = await getAddress(api);
      setWallet({ status: 'connected', address, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet.';
      setWallet({ status: 'error', address: null, error: message });
    }
  }, []);

  const disconnect = useCallback(() => setWallet(INITIAL_STATE), []);

  return { wallet, connect, disconnect };
}
