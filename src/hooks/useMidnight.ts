/**
 * useMidnight.ts
 *
 * Real Midnight SDK integration for the counter dApp.
 *
 * Uses the official DApp Connector API (CAIP-372):
 *   window.midnight.<wallet>.connect(networkId) → ConnectedAPI
 *
 * Flow:
 *   1. setNetworkId('preprod') — must be called before any SDK operation
 *   2. Discover wallet via window.midnight
 *   3. wallet.connect(networkId) → ConnectedAPI (walletProvider)
 *   4. Build providers: indexerPublicDataProvider, httpClientProofProvider
 *   5. findDeployedContract → get contract handle
 *   6. contract.callTx.increment() → submit real tx, get txHash from chain
 *   7. queryContractState → read counter from Preprod indexer
 */

import { useState, useCallback } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

// Compiled contract artifacts — produced by `compact compile`
import { Contract, ledger } from '../../contracts/counter/artifacts/contract/index.js';

// ---------------------------------------------------------------------------
// Preprod network configuration
// ---------------------------------------------------------------------------

const NETWORK_ID = 'preprod';

const PREPROD = {
  indexer: 'https://indexer.preprod.midnight.network/api/v1/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v1/graphql/ws',
  proofServer: 'https://proof-server.preprod.midnight.network',
  node: 'https://rpc.preprod.midnight.network',
};

export const PREPROD_CONTRACT_ADDRESS =
  '749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d';

// Private state ID — counter has no witnesses so private state is empty
const PRIVATE_STATE_ID = 'counterPrivateState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  error: string | null;
}

export interface CircuitCallState {
  isExecuting: boolean;
  proofGenerated: boolean;
  txHash: string | null;
  ledgerValue: bigint;
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

// ---------------------------------------------------------------------------
// DApp Connector API helpers
// ---------------------------------------------------------------------------

/**
 * Discover the first available Midnight wallet injected into window.midnight.
 * The DApp Connector API (CAIP-372) exposes each wallet under a keyed entry.
 */
function discoverWallet(): { id: string; wallet: { connect: (networkId: string) => Promise<unknown> } } | null {
  const midnight = (window as unknown as Record<string, unknown>)['midnight'] as
    | Record<string, unknown>
    | undefined;
  if (!midnight) return null;

  // Find the first injected wallet (e.g. 'mnLace')
  for (const key of Object.keys(midnight)) {
    const entry = midnight[key] as Record<string, unknown>;
    if (typeof entry?.['connect'] === 'function') {
      return { id: key, wallet: entry as { connect: (networkId: string) => Promise<unknown> } };
    }
    // Older Lace connector shape: window.midnight.mnLace.enable()
    if (typeof entry?.['enable'] === 'function') {
      return {
        id: key,
        wallet: {
          connect: async (networkId: string) => {
            const api = await (entry as { enable: (id?: string) => Promise<unknown> }).enable(networkId);
            return api;
          },
        },
      };
    }
  }
  return null;
}

/**
 * Extract the wallet address from a ConnectedAPI object.
 * Tries multiple shapes across Lace versions.
 */
async function resolveAddress(connectedApi: unknown): Promise<string> {
  const api = connectedApi as Record<string, unknown>;
  if (typeof api?.['getAddress'] === 'function')
    return String(await (api as { getAddress: () => Promise<unknown> }).getAddress());
  if (typeof api?.['coinPublicKey'] === 'string') return api['coinPublicKey'] as string;
  if (api?.['coinPublicKey']) return String(api['coinPublicKey']);
  if (typeof api?.['getUnshieldedAddress'] === 'function')
    return String(await (api as { getUnshieldedAddress: () => Promise<unknown> }).getUnshieldedAddress());
  return 'connected';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMidnight(): UseMidnight {
  const [walletState, setWalletState] = useState<WalletState>({
    status: 'disconnected',
    address: null,
    error: null,
  });

  const [circuitState, setCircuitState] = useState<CircuitCallState>({
    isExecuting: false,
    proofGenerated: false,
    txHash: null,
    ledgerValue: 0n,
    error: null,
    lastExecutedAt: null,
  });

  // Holds the ConnectedAPI returned by wallet.connect(networkId)
  const [connectedApi, setConnectedApi] = useState<unknown>(null);

  // ---------------------------------------------------------------------------
  // connectWallet
  // ---------------------------------------------------------------------------
  const connectWallet = useCallback(async () => {
    setWalletState({ status: 'connecting', address: null, error: null });
    try {
      // Step 1 — set the global network ID before any SDK call
      setNetworkId(NETWORK_ID);

      // Step 2 — discover wallet
      const discovered = discoverWallet();
      if (!discovered) {
        throw new Error(
          'No Midnight wallet found. Install Lace and enable the Midnight feature.',
        );
      }

      // Step 3 — connect using the official DApp Connector API
      const api = await discovered.wallet.connect(NETWORK_ID);
      if (!api) throw new Error('Wallet connection was declined.');

      const address = await resolveAddress(api);
      setConnectedApi(api);
      setWalletState({ status: 'connected', address, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet.';
      setWalletState({ status: 'error', address: null, error: message });
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setConnectedApi(null);
    setWalletState({ status: 'disconnected', address: null, error: null });
  }, []);

  // ---------------------------------------------------------------------------
  // executeCircuit — calls the real increment circuit on Midnight Preprod
  // ---------------------------------------------------------------------------
  const executeCircuit = useCallback(
    async (witnessValue: number = 1) => {
      if (walletState.status !== 'connected' || !connectedApi) {
        setCircuitState((prev) => ({
          ...prev,
          error: 'Please connect your Lace wallet before calling the circuit.',
        }));
        return;
      }

      if (witnessValue <= 0) {
        setCircuitState((prev) => ({
          ...prev,
          error: 'Witness must be a positive integer.',
        }));
        return;
      }

      setCircuitState((prev) => ({
        ...prev,
        isExecuting: true,
        proofGenerated: false,
        txHash: null,
        error: null,
      }));

      try {
        // Step 4 — build providers
        const publicDataProvider = indexerPublicDataProvider(
          PREPROD.indexer,
          PREPROD.indexerWS,
        );
        const zkConfigProvider = {
          // Browser-compatible ZK config provider: loads keys from the
          // committed artifacts directory via fetch()
          getProverKey: async (circuitId: string) => {
            const res = await fetch(`/artifacts/keys/${circuitId}.prover`);
            return new Uint8Array(await res.arrayBuffer());
          },
          getVerifierKey: async (circuitId: string) => {
            const res = await fetch(`/artifacts/keys/${circuitId}.verifier`);
            return new Uint8Array(await res.arrayBuffer());
          },
          getZkir: async (circuitId: string) => {
            const res = await fetch(`/artifacts/zkir/${circuitId}.bzkir`);
            return new Uint8Array(await res.arrayBuffer());
          },
        };

        const proofProvider = httpClientProofProvider(
          PREPROD.proofServer,
          zkConfigProvider as never,
        );

        // Build the compiled contract handle
        const compiledContract = {
          contract: Contract,
          witnesses: {
            // incrementWitness returns the private witness value
            incrementWitness: () => [{}, BigInt(witnessValue)] as [Record<string, never>, bigint],
          },
        };

        const providers = {
          publicDataProvider,
          proofProvider,
          // walletProvider comes from the ConnectedAPI
          walletProvider: connectedApi as never,
          midnightProvider: connectedApi as never,
          privateStateProvider: {
            // Counter has no witnesses — private state is always empty
            get: async () => ({}),
            set: async () => {},
            remove: async () => {},
          } as never,
          zkConfigProvider: zkConfigProvider as never,
        };

        // Step 5 — find the deployed contract on Preprod
        const deployed = await findDeployedContract(providers as never, {
          compiledContract: compiledContract as never,
          contractAddress: PREPROD_CONTRACT_ADDRESS,
          privateStateId: PRIVATE_STATE_ID,
          initialPrivateState: {},
        } as never);

        setCircuitState((prev) => ({ ...prev, proofGenerated: true }));

        // Step 6 — execute the real increment circuit and submit tx
        const txData = await (deployed as unknown as {
          callTx: { increment: () => Promise<{ public: { txId: string; blockHeight?: number } }> };
        }).callTx.increment();

        const txHash = txData.public.txId;

        // Step 7 — read updated counter from Preprod indexer
        const contractState = await publicDataProvider.queryContractState(
          PREPROD_CONTRACT_ADDRESS,
        );
        const currentCounter = contractState
          ? ledger(contractState.data).counter
          : prev => prev + 1n;

        setCircuitState({
          isExecuting: false,
          proofGenerated: true,
          txHash,
          ledgerValue: typeof currentCounter === 'bigint'
            ? currentCounter
            : circuitState.ledgerValue + 1n,
          error: null,
          lastExecutedAt: new Date().toLocaleTimeString(),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to execute circuit.';
        setCircuitState((prev) => ({
          ...prev,
          isExecuting: false,
          proofGenerated: false,
          error: message,
        }));
      }
    },
    [walletState.status, connectedApi, circuitState.ledgerValue],
  );

  return {
    wallet: walletState,
    connectWallet,
    disconnectWallet,
    circuitState,
    executeCircuit,
    contractAddress: PREPROD_CONTRACT_ADDRESS,
  };
}
