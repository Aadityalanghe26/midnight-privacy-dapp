import { useState, useCallback } from 'react';
import { useWallet, WalletStatus, WalletState } from './useWallet';

export interface CircuitCallState {
  isExecuting: boolean;
  proofGenerated: boolean;
  txHash: string | null;
  ledgerValue: number;
  error: string | null;
  lastExecutedAt: string | null;
}

export interface UseMidnight {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  circuitState: CircuitCallState;
  executeCircuit: (witnessValue?: number) => Promise<void>;
  contractAddress: string;
}

export const PREPROD_CONTRACT_ADDRESS = '749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d';

export function useMidnight(): UseMidnight {
  const { wallet, connect, disconnect } = useWallet();

  const [circuitState, setCircuitState] = useState<CircuitCallState>({
    isExecuting: false,
    proofGenerated: false,
    txHash: null,
    ledgerValue: 0,
    error: null,
    lastExecutedAt: null,
  });

  const executeCircuit = useCallback(async (witnessValue: number = 42) => {
    if (wallet.status !== 'connected') {
      setCircuitState((prev) => ({
        ...prev,
        error: 'Please connect your Lace wallet before calling the circuit.',
      }));
      return;
    }

    if (witnessValue <= 0) {
      setCircuitState((prev) => ({
        ...prev,
        error: 'Invalid witness: Must be a positive integer.',
      }));
      return;
    }

    setCircuitState((prev) => ({
      ...prev,
      isExecuting: true,
      proofGenerated: false,
      error: null,
    }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setCircuitState((prev) => ({
        ...prev,
        proofGenerated: true,
      }));

      await new Promise((resolve) => setTimeout(resolve, 600));

      const mockTxHash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      setCircuitState((prev) => ({
        isExecuting: false,
        proofGenerated: true,
        txHash: mockTxHash,
        ledgerValue: prev.ledgerValue + 1,
        error: null,
        lastExecutedAt: new Date().toLocaleTimeString(),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to execute circuit transaction';
      setCircuitState((prev) => ({
        ...prev,
        isExecuting: false,
        proofGenerated: false,
        error: msg,
      }));
    }
  }, [wallet.status]);

  return {
    wallet,
    connectWallet: connect,
    disconnectWallet: disconnect,
    circuitState,
    executeCircuit,
    contractAddress: PREPROD_CONTRACT_ADDRESS,
  };
}
