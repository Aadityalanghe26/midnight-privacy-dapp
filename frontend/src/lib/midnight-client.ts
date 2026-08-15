// @ts-nocheck
// Midnight SDK wrapper — SDK packages are not installed in the frontend workspace.
// All SDK imports are lazy (dynamic import inside async functions) so this module
// loads without error even when the SDK is absent.

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface MidnightClientConfig {
  nodeEndpoint?: string;
  indexerEndpoint?: string;
  indexerWSEndpoint?: string;
  proofServerEndpoint?: string;
  zkConfigPath?: string;
}

const DEFAULT_CONFIG: Required<MidnightClientConfig> = {
  nodeEndpoint: 'ws://localhost:9944',
  indexerEndpoint: 'http://localhost:8088/api/v1/graphql',
  indexerWSEndpoint: 'ws://localhost:8088/api/v1/graphql/ws',
  proofServerEndpoint: 'http://localhost:6300',
  zkConfigPath: './artifacts',
};

function resolveConfig(
  config?: MidnightClientConfig,
): Required<MidnightClientConfig> {
  return { ...DEFAULT_CONFIG, ...config };
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface DeployCounterResult {
  contractAddress: string;
  txHash: string;
}

export interface IncrementResult {
  txHash: string;
  newValue: bigint;
}

// ---------------------------------------------------------------------------
// deployCounter
// ---------------------------------------------------------------------------

export async function deployCounter(
  walletProvider: unknown,
  accountId: string,
  config?: MidnightClientConfig,
): Promise<DeployCounterResult> {
  const cfg = resolveConfig(config);

  const { deployContract } = await import(
    '@midnight-ntwrk/midnight-js-contracts'
  );
  const { createMidnightProvider } = await import(
    '@midnight-ntwrk/midnight-js-network-id'
  );

  const provider = await createMidnightProvider({
    nodeEndpoint: cfg.nodeEndpoint,
    indexerEndpoint: cfg.indexerEndpoint,
    indexerWSEndpoint: cfg.indexerWSEndpoint,
    proofServerEndpoint: cfg.proofServerEndpoint,
    walletProvider,
    accountId,
  });

  const { contractAddress, txHash } = await deployContract(provider, {
    zkConfigPath: cfg.zkConfigPath,
  });

  return { contractAddress, txHash };
}

// ---------------------------------------------------------------------------
// getCounterState
// ---------------------------------------------------------------------------

export async function getCounterState(
  contractAddress: string,
  config?: MidnightClientConfig,
): Promise<bigint> {
  const cfg = resolveConfig(config);

  const { getContractState } = await import(
    '@midnight-ntwrk/midnight-js-contracts'
  );
  const { createMidnightProvider } = await import(
    '@midnight-ntwrk/midnight-js-network-id'
  );

  const provider = await createMidnightProvider({
    nodeEndpoint: cfg.nodeEndpoint,
    indexerEndpoint: cfg.indexerEndpoint,
    indexerWSEndpoint: cfg.indexerWSEndpoint,
    proofServerEndpoint: cfg.proofServerEndpoint,
  });

  const state = await getContractState(provider, contractAddress);
  return state.counter as bigint;
}

// ---------------------------------------------------------------------------
// increment
// ---------------------------------------------------------------------------

export async function increment(
  contractAddress: string,
  witnessValue: bigint,
  walletProvider: unknown,
  accountId: string,
  config?: MidnightClientConfig,
): Promise<IncrementResult> {
  const cfg = resolveConfig(config);

  const { callContract } = await import(
    '@midnight-ntwrk/midnight-js-contracts'
  );
  const { createMidnightProvider } = await import(
    '@midnight-ntwrk/midnight-js-network-id'
  );

  const provider = await createMidnightProvider({
    nodeEndpoint: cfg.nodeEndpoint,
    indexerEndpoint: cfg.indexerEndpoint,
    indexerWSEndpoint: cfg.indexerWSEndpoint,
    proofServerEndpoint: cfg.proofServerEndpoint,
    walletProvider,
    accountId,
  });

  const { txHash, newState } = await callContract(
    provider,
    contractAddress,
    'increment',
    { witnessValue },
    { zkConfigPath: cfg.zkConfigPath },
  );

  return { txHash, newValue: newState.counter as bigint };
}
