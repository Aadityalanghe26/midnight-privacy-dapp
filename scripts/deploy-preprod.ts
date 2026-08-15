/**
 * deploy-preprod.ts
 * Deploy the counter contract to Midnight Preprod.
 *
 * Usage:
 *   cd mn-demo
 *   npm run deploy -- --network preprod
 *
 * Prerequisites:
 *   1. Docker proof server running: npm run proof-server:start
 *   2. Fund the wallet address shown at startup from the Preprod faucet:
 *      https://midnight.network/faucet
 *   3. Wait for tNIGHT to arrive (script polls automatically)
 *
 * The deployed contract address is saved to .midnight-state.json and
 * printed to stdout. Paste it into README.md.
 */

// This script re-uses the mn-demo deploy pipeline with --network preprod.
// Run it from the mn-demo directory where the Midnight SDK is installed.
//
// The deploy.ts in mn-demo/src/ already supports --network preprod via
// the resolveNetwork() helper. This file is documentation-only — the
// actual deployment command is:
//
//   cd mn-demo && npm run deploy -- --network preprod
//
// After deployment, record the contract address in README.md under
// the Contract Address table (Preprod row).

export {};
