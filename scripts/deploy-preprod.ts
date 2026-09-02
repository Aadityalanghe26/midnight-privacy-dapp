/**
 * deploy-preprod.ts
 *
 * Deploy the counter contract to Midnight Preprod using the real
 * Midnight.js SDK deployContract() function.
 *
 * Prerequisites:
 *   1. Contract compiled:
 *        npx compact compile contracts/counter/counter.compact contracts/counter/artifacts
 *   2. Docker proof server running:
 *        docker compose -f mn-demo/docker-compose.yml up -d
 *   3. Wallet funded from Preprod faucet:
 *        https://midnight.network/faucet
 *   4. Environment variables set:
 *        MIDNIGHT_SEED=<64-char hex seed>
 *        PRIVATE_STATE_PASSWORD=<password min 16 chars>
 *
 * Usage:
 *   npx tsx scripts/deploy-preprod.ts
 *
 * The deployed contract address is printed to stdout.
 * Paste it into README.md under the Contract Address table.
 *
 * Current deployed address (Preprod):
 *   749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';

// Midnight SDK — real deployContract() (fix #9)
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// Required for GraphQL subscriptions over WebSocket
// @ts-expect-error polyfill required by Midnight SDK
globalThis.WebSocket = WebSocket;

// ---------------------------------------------------------------------------
// Network configuration — Midnight Preprod
// ---------------------------------------------------------------------------

const NETWORK_ID = 'preprod';

const PREPROD = {
  indexer: 'https://indexer.preprod.midnight.network/api/v1/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v1/graphql/ws',
  proofServer: 'http://localhost:6300', // local Docker proof server
  node: 'https://rpc.preprod.midnight.network',
};

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_PATH = path.resolve(__dirname, '..', 'contracts', 'counter', 'artifacts');
const CONTRACT_PATH = path.join(ARTIFACTS_PATH, 'contract', 'index.js');

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Deploy counter contract to Midnight Preprod               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1 — set global network ID before any SDK operation (fix #10)
  setNetworkId(NETWORK_ID);

  // Step 2 — verify compiled artifacts exist
  if (!fs.existsSync(CONTRACT_PATH)) {
    console.error('❌ Contract not compiled. Run:');
    console.error('   npx compact compile contracts/counter/counter.compact contracts/counter/artifacts\n');
    process.exit(1);
  }
  console.log('✓ Compiled artifacts found\n');

  // Step 3 — load compiled contract
  const CounterModule = await import(pathToFileURL(CONTRACT_PATH).href);
  const compiledContract = CompiledContract.make('counter', CounterModule.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(ARTIFACTS_PATH),
  );
  console.log('✓ Contract loaded\n');

  // Step 4 — load wallet from mn-demo (shares wallet state)
  // Import wallet utilities from mn-demo
  const { resolveNetwork, getOrCreateWallet, recordDeployment } = await import(
    pathToFileURL(path.resolve(__dirname, '..', 'mn-demo', 'src', 'network.js')).href
  );
  const { createWallet, persistWalletState, unshieldedToken } = await import(
    pathToFileURL(path.resolve(__dirname, '..', 'mn-demo', 'src', 'wallet.js')).href
  );

  const { config: networkConfig } = resolveNetwork('preprod');
  const walletInfo = getOrCreateWallet('preprod');

  console.log('─── Wallet setup ────────────────────────────────────────────────\n');
  console.log('  Creating wallet...');
  const walletCtx = await createWallet({
    network: 'preprod',
    networkConfig: {
      ...networkConfig,
      proofServer: PREPROD.proofServer,
      indexer: PREPROD.indexer,
      indexerWS: PREPROD.indexerWS,
    },
    seed: walletInfo.seed,
  });

  console.log('  Syncing with Preprod...');
  const syncStart = Date.now();
  const syncInterval = setInterval(() => {
    process.stdout.write(`\r  ⏳ Syncing... (${Math.round((Date.now() - syncStart) / 1000)}s)`);
  }, 3000);

  const state = await walletCtx.wallet.waitForSyncedState();
  clearInterval(syncInterval);
  process.stdout.write('\r  ✓ Synced!                                    \n\n');

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  Address: ${address}`);
  console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

  if (balance === 0n) {
    console.error('❌ Wallet has no tNight. Fund it from the faucet:');
    console.error('   https://midnight.network/faucet');
    console.error(`   Address: ${address}\n`);
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  await persistWalletState('preprod', walletCtx);

  // Step 5 — build providers
  const privateStatePassword =
    process.env.PRIVATE_STATE_PASSWORD?.trim() ?? 'Preprod-Deployment-Placeholder-1';

  const zkConfigProvider = new NodeZkConfigProvider(ARTIFACTS_PATH);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: unknown, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: unknown) => walletCtx.wallet.submitTransaction(tx) as unknown,
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'counter-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(PREPROD.indexer, PREPROD.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PREPROD.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  // Step 6 — deploy using the real deployContract() (fix #9)
  console.log('─── Deploying contract ──────────────────────────────────────────\n');
  console.log('  Deploying counter contract to Preprod...');
  console.log('  (This may take 1-3 minutes while the proof server generates proofs)\n');

  const deployed = await deployContract(providers as never, {
    compiledContract: compiledContract as never,
    args: [],
    privateStateId: 'counterPrivateState',
    initialPrivateState: {},
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;

  console.log('  ✅ Contract deployed successfully!\n');
  console.log(`  Contract Address: ${contractAddress}\n`);
  console.log('  ──────────────────────────────────────────────────────────────');
  console.log('  Paste this address into README.md under the Contract Address table.');
  console.log('  ──────────────────────────────────────────────────────────────\n');

  // Save deployment record
  recordDeployment('preprod', contractAddress, address.toString());
  console.log('  Saved to .midnight-state.json\n');

  await persistWalletState('preprod', walletCtx);
  await walletCtx.wallet.stop();

  console.log('─── Done ────────────────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
