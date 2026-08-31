# Midnight Privacy dApp
> A privacy-preserving Web3 dApp on Midnight Network. ZK proofs generated in the browser - private witnesses never leave your device.

## Live Demo
**[https://sparkly-biscochitos-b20a8a.netlify.app](https://sparkly-biscochitos-b20a8a.netlify.app)**

## Demo Video
[https://www.loom.com/share/7a3a71a530f547dbbc9a2338409a4f39](https://www.loom.com/share/7a3a71a530f547dbbc9a2338409a4f39)

## Contract Address
| Network | Address |
|---------|---------|
| Preprod | 749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d |

## What This Does
Users connect Lace wallet, supply a private witness locally, and the dApp generates a ZK proof entirely in the browser. The counter increments on-chain. The witness is never transmitted or shown.

## Privacy Model
- **What is PUBLIC:** Counter value, transaction hash, ZK proof validity
- **What is PRIVATE:** The witness value and its magnitude
- **What the user PROVES without revealing:** witness > 0 (a valid positive witness exists)

## Privacy Claim
An on-chain observer **CAN** see: counter increased by 1, valid ZK proof submitted, transaction hash.
An on-chain observer **CANNOT** see: the witness value, its magnitude, or any user input.

## Tech Stack
Midnight Network, Compact, Midnight.js SDK, React + Vite, Lace wallet, Vitest + fast-check

## Prerequisites
- [Lace wallet](https://www.lace.io) browser extension installed
- Node.js v22+

## Run Locally
```bash
git clone https://github.com/Aadityalanghe26/midnight-privacy-dapp.git
cd midnight-privacy-dapp
npm install
npm run dev
```
Then open http://localhost:5173 in your browser.

## Run Tests
```bash
npm test
```

## Deploy
Pre-configured for Netlify and Vercel. Connect the repo on either platform - config files handle the rest.

## License
MIT
