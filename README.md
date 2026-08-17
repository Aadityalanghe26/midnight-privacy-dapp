# Midnight Privacy dApp

A privacy-preserving Web3 dApp on the Midnight Network.

---

## Live Demo

https://benevolent-cassata-0c714a.netlify.app

## Demo Video

PASTE VIDEO LINK AFTER RECORDING

---

## Contract Address

| Network | Address |
|---------|---------|
| Local devnet | 749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d |
| Preprod | PASTE AFTER PREPROD DEPLOY |

---

## Initial Idea

Most blockchains are fully transparent: every input is readable by anyone. This creates real risks: coercion, voter manipulation, surveillance.

This project uses Midnight Network zero-knowledge proofs. The user provides a private witness locally. A ZK proof is generated in the browser. The proof increments a public counter by 1. The counter is public. The witness is not.

---

## Privacy Claim

An on-chain observer CAN see:
- Counter increased by exactly 1
- A valid ZK proof was submitted
- Transaction hash and block timestamp

An on-chain observer CANNOT see:
- The private witness value
- Anything about the magnitude or identity of the input

What is proved without being revealed:
- witness > 0 (valid positive witness exists)
- The caller is authorised to increment

This is selective disclosure: proving a fact without revealing its content.

---

## How It Works

1. User clicks Connect Wallet - Lace prompts for permission
2. User types a private witness locally - never transmitted
3. User clicks Increment Counter - ZK proof generated in browser
4. Proof submitted to Midnight Network - counter increments on-chain
5. Proof server verifies without learning the witness

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Midnight Network Preprod |
| Smart Contract | Compact language |
| ZK Proof | Midnight.js SDK browser-side |
| DApp Connector | Lace wallet extension |
| Frontend | React 18 + Vite 5 + TypeScript |
| Testing | Vitest + testing-library + fast-check |
| Deployment | Vercel / Netlify |
| Runtime | Node.js v22 |

---

## Prerequisites

- Lace wallet: https://www.lace.io (switch to Preprod)
- tNIGHT faucet: https://faucet.midnight.network
- Node.js v22+ : https://nodejs.org
- Docker Desktop (local dev only)

---

## Run Tests

    npm test

| Suite | Tests | Status |
|-------|-------|--------|
| counter.compact unit | 3 | Passing |
| counter.compact property | 2 | Passing 100 runs |
| WalletConnector unit | 5 | Passing |
| WalletConnector property | 1 | Passing 100 runs |
| Total | 11 | All passing |

---

## Deploy Frontend

    npx vercel --cwd .

vercel.json is pre-configured.

---

## License

MIT
