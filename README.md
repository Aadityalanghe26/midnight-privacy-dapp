# Midnight Privacy dApp
> Privacy-preserving Web3 dApp on Midnight Network.

## Live Demo
**[https://sparkly-biscochitos-b20a8a.netlify.app](https://sparkly-biscochitos-b20a8a.netlify.app)**

## Demo Video
[https://www.loom.com/share/f2d97444793146cfba7090cd0aa72fbd](https://www.loom.com/share/f2d97444793146cfba7090cd0aa72fbd)

## Contract Address
| Network | Address |
|---------|---------|
| Local devnet | 749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d |
| Preprod | PASTE AFTER PREPROD DEPLOY |

## What This Does
Users connect Lace wallet, supply a private witness locally, generate a ZK proof in browser, and submit it. The counter increments on-chain. The witness never leaves the browser.

## Privacy Model
- What is PUBLIC: Counter value, transaction hash, ZK proof validity
- What is PRIVATE: The witness value, local proof generation state
- What the user PROVES without revealing: witness > 0 (valid positive witness exists)

## Privacy Claim
Observer CAN see: counter increased by 1, valid proof submitted, tx hash.
Observer CANNOT see: witness value, its magnitude, or any user input.

## Tech Stack
Midnight Network, Compact, Midnight.js SDK, React + Vite, Lace wallet, Vitest + fast-check

## Prerequisites
- Lace wallet: https://www.lace.io
- Node.js v22+
- Docker Desktop (local only)

## Run Locally
Clone the repo, run npm install, then start the frontend workspace.

## Run Tests
Run npm test from the project root.

## License
MIT