import { useState, useCallback } from 'react';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  error: string | null;
  /** Raw Lace Midnight API object — passed to SDK calls as walletProvider */
  api: unknown | null;
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
  api: null,
};

async function getLaceAPI(): Promise<unknown> {
  const w = window as unknown as Record<string, unknown>;
  const midnight = w['midnight'] as Record<string, unknown> | undefined;
  if (!midnight) return null;
  if (typeof (midnight['mnLace'] as Record<string, unknown>)?.['enable'] === 'function') {
    return await (midnight['mnLace'] as { enable: () => Promise<unknown> }).enable();
  }
  if (typeof midnight['enable'] === 'function') {
    return await (midnight as { enable: () => Promise<unknown> }).enable();
  }
  return midnight;
}

async function getAddress(api: unknown): Promise<string> {
  const a = api as Record<string, unknown>;
  if (typeof a?.['getAddress'] === 'function')
    return await (a as { getAddress: () => Promise<string> }).getAddress();
  if (typeof a?.['coinPublicKey'] === 'string') return a['coinPublicKey'] as string;
  if (a?.['coinPublicKey']) return String(a['coinPublicKey']);
  if (typeof a?.['getUnshieldedAddress'] === 'function')
    return await (a as { getUnshieldedAddress: () => Promise<string> }).getUnshieldedAddress();
  return 'connected';
}

export function useWallet(): UseWallet {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_STATE);

  const connect = useCallback(async () => {
    setWallet({ status: 'connecting', address: null, error: null, api: null });
    try {
      const w = window as unknown as Record<string, unknown>;
      if (!w['midnight'])
        throw new Error('Lace wallet not found. Install Lace and enable Midnight.');
      const api = await getLaceAPI();
      if (!api) throw new Error('Could not connect to Lace Midnight connector.');
      const address = await getAddress(api);
      setWallet({ status: 'connected', address, error: null, api });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet.';
      setWallet({ status: 'error', address: null, error: message, api: null });
    }
  }, []);

  const disconnect = useCallback(() => setWallet(INITIAL_STATE), []);

  return { wallet, connect, disconnect };
}
