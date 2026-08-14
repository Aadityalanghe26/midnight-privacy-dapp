/**
 * midnight-client.ts
 *
 * Midnight.js SDK wrapper for the counter contract.
 *
 * Provides three public functions:
 *   - deployCounter   — deploy a fresh counter contract and return its address
 *   - getCounterState — read the current public counter value from the ledger
 *   - increment       — call the increment circuit with a private witness
 *
 * All network/provider wiring is encapsulated here so UI components stay
 * framework-agnostic. The proof server is assumed to be running locally at
 * http://localhost:6300 (set via config or the VITE_PROOF_SERVER env var).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Configuration required to create a MidnightClient session.
 * All fields are optional; sensible local-devnet defaults are used when omitted.
 */
export interface MidnightClientConfig {
  /** WebSocket URL of the Midnight node RPC endpoint. Default: ws://localhost:9944 */
  nodeEndpoint?: string;
  /** HTTP URL of the indexer GraphQL endpoint. Default: http://localhost:8088/api/v1/graphql */
  indexerEndpoint?: string;
  /** WebSocket URL of the indexer subscription endpoint. Default: ws://localhost:8088/api/v1/graphql/ws */
  indexerWSEndpoint?: string;
  /** HTTP URL of the proof server. Default: http://localhost:6300 */
  proofServerEndpoint?: string;
  /** Path to compiled contract artifacts. Default: resolved relative to this module */
  zkConfigPath?: string;
}

/**
 * Result returned by deployCounter.
 */
export interface DeployCounterResult {
  /** On-chain contract address (hex string) */
  contractAddress: string;
  /** Transaction ID of the deploy transaction */
  txId: string;
}

/**
 * Result returned by increment.
 */
export interface IncrementResult {
  /** New counter value after the increment */
  newValue: bigint;
  /** Transaction ID of the increment transaction */
  txId: string;
  /** Block height at which the transaction was included */
  blockHeight: number;
}

// ─── Default configuration ────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<MidnightClientConfig> = {
  nodeEndpoint: 'ws://localhost:9944',
  indexerEndpoint: 'http://localhost:8088/api/v1/graphql',
  indexerWSEndpoint: 'ws://localhost:8088/api/v1/graphql/ws',
  proofServerEndpoint:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PROOF_SERVER) ||
    'http://localhost:6300',
  zkConfigPath: '',
};

function resolveConfig(config?: MidnightClientConfig): Required<MidnightClientConfig> {
  return { ...DEFAULT_CONFIG, ...config };
}

// ─── Private-state key ────────────────────────────────────────────────────────

/** Stable ID used to persist the counter contract's private state across sessions. */
const PRIVATE_STATE_ID = 'counterPrivateState';

/**
 * Minimum password length required by the Midnight SDK's level-db private
 * state provider. Must be ≥ 16 characters.
 */
const PRIVATE_STATE_PASSWORD =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PRIVATE_STATE_PASSWORD) ||
  'Local-Devnet-Development-Placeholder-1';

// ─── Lazy SDK imports ─────────────────────────────────────────────────────────
//
// The Midnight SDK bundles heavy WASM modules. We import them lazily so that
// the initial JS bundle stays small and the modules load only when needed.
// Node.js tests that mock these functions will never hit the actual imports.

async function loadSDK() {
  const [
    { deployContract, findDeployedContract },
    { httpClientProofProvider },
    { indexerPublicDataProvider },
    { levelPrivateStateProvider },
    { NodeZkConfigProvider },
    { CompiledContract },
  ] = await Promise.all([
    import('@midnight-ntwrk/midnight-js-contracts'),
    import('@midnight-ntwrk/midnight-js-http-client-proof-provider'),
    import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
    import('@midnight-ntwrk/midnight-js-level-private-state-provider'),
    import('@midnight-ntwrk/midnight-js-node-zk-config-provider'),
    import('@midnight-ntwrk/midnight-js-protocol/compact-js'),
  ]);

  return {
    deployContract,
    findDeployedContract,
    httpClientProofProvider,
    indexerPublicDataProvider,
    levelPrivateStateProvider,
    NodeZkConfigProvider,
    CompiledContract,
  };
}

// ─── Providers factory ────────────────────────────────────────────────────────

/**
 * Build the full provider set required by deployContract / findDeployedContract.
 *
 * `walletProvider` and `midnightProvider` are intentionally typed as `any`
 * because they are injected by the caller (the UI layer passes in a live
 * wallet context obtained from the Lace/wallet-sdk hook).
 */
function buildProviders(
  cfg: Required<MidnightClientConfig>,
  walletProvider: any,
  accountId: string,
  sdk: Awaited<ReturnType<typeof loadSDK>>,
) {
  const { httpClientProofProvider, indexerPublicDataProvider, levelPrivateStateProvider, NodeZkConfigProvider } = sdk;

  const zkConfigProvider = new NodeZkConfigProvider(cfg.zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'counter-state',
      accountId,
      privateStoragePasswordProvider: () => PRIVATE_STATE_PASSWORD,
    }),
    publicDataProvider: indexerPublicDataProvider(cfg.indexerEndpoint, cfg.indexerWSEndpoint),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(cfg.proofServerEndpoint, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ─── Compiled contract loader ─────────────────────────────────────────────────

/**
 * Load and wrap the compiled counter contract artifacts.
 * `zkConfigPath` must point to the directory that contains the
 * `contract/index.js` file produced by `compactc`.
 */
async function loadCompiledContract(zkConfigPath: string, sdk: Awaited<ReturnType<typeof loadSDK>>) {
  const { CompiledContract } = sdk;

  // Dynamic import of the compiled contract JS.
  // In a Vite project this works via the ?url import or explicit path alias.
  // We use a URL-safe dynamic import so Vite can code-split it.
  const contractModule = await import(
    /* @vite-ignore */
    `${zkConfigPath}/contract/index.js`
  );

  return CompiledContract.make('counter', contractModule.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Deploy a fresh instance of the counter contract.
 *
 * @param walletProvider - A Midnight.js-compatible wallet provider (from useWallet hook)
 * @param accountId      - Bech32 account address string (used for private state storage key)
 * @param config         - Optional client configuration overrides
 * @returns DeployCounterResult containing the contract address and deploy tx ID
 */
export async function deployCounter(
  walletProvider: any,
  accountId: string,
  config?: MidnightClientConfig,
): Promise<DeployCounterResult> {
  const cfg = resolveConfig(config);
  const sdk = await loadSDK();
  const compiledContract = await loadCompiledContract(cfg.zkConfigPath, sdk);
  const providers = buildProviders(cfg, walletProvider, accountId, sdk);

  const deployed = await sdk.deployContract(providers, {
    compiledContract: compiledContract as any,
    args: [],
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
  });

  return {
    contractAddress: deployed.deployTxData.public.contractAddress,
    txId: deployed.deployTxData.public.txId,
  };
}

/**
 * Read the current public counter value from the ledger.
 *
 * This is a read-only operation — it queries the indexer directly without
 * generating a proof or submitting a transaction.
 *
 * @param contractAddress - On-chain address of the deployed counter contract
 * @param config          - Optional client configuration overrides
 * @returns Current counter value as a bigint
 */
export async function getCounterState(
  contractAddress: string,
  config?: MidnightClientConfig,
): Promise<bigint> {
  const cfg = resolveConfig(config);
  const sdk = await loadSDK();

  // Load the contract module for the ledger() decoder.
  const contractModule = await import(
    /* @vite-ignore */
    `${cfg.zkConfigPath}/contract/index.js`
  );

  const publicDataProvider = sdk.indexerPublicDataProvider(cfg.indexerEndpoint, cfg.indexerWSEndpoint);
  const contractState = await publicDataProvider.queryContractState(contractAddress);

  if (!contractState) {
    return 0n;
  }

  const ledgerState = contractModule.ledger(contractState.data);
  return ledgerState.counter;
}

/**
 * Call the increment circuit with a private witness value.
 *
 * Generates a zero-knowledge proof that `witness > 0` without revealing
 * the witness, then submits the increment transaction on-chain.
 *
 * @param contractAddress - On-chain address of the deployed counter contract
 * @param witnessValue    - Private witness (must be > 0)
 * @param walletProvider  - A Midnight.js-compatible wallet provider
 * @param accountId       - Bech32 account address string
 * @param config          - Optional client configuration overrides
 * @returns IncrementResult with new counter value, tx ID, and block height
 */
export async function increment(
  contractAddress: string,
  witnessValue: bigint,
  walletProvider: any,
  accountId: string,
  config?: MidnightClientConfig,
): Promise<IncrementResult> {
  if (witnessValue <= 0n) {
    throw new Error('Witness must be a positive integer');
  }

  const cfg = resolveConfig(config);
  const sdk = await loadSDK();
  const compiledContract = await loadCompiledContract(cfg.zkConfigPath, sdk);
  const providers = buildProviders(cfg, walletProvider, accountId, sdk);

  // Reconnect to the already-deployed contract. The witness function is
  // injected here so it stays private and never leaves the client.
  const deployed: any = await sdk.findDeployedContract(providers, {
    compiledContract: compiledContract as any,
    contractAddress,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
    // Supply the private witness to the circuit.
    witnesses: {
      incrementWitness: () => witnessValue,
    },
  });

  const tx = await deployed.callTx.increment();

  return {
    newValue: tx.public.result ?? 0n,
    txId: tx.public.txId,
    blockHeight: tx.public.blockHeight,
  };
}
