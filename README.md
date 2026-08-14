# Midnight Privacy dApp

> A privacy-preserving voting system on the Midnight network — on-chain tallies are public, individual votes stay private via zero-knowledge proofs.

[![CI](https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/actions/workflows/ci.yml)

## Contract Address

| Network | Address |
|---------|---------|
| Preview | [PASTE ADDRESS AFTER DEPLOY] |
| Preprod | [PASTE ADDRESS AFTER DEPLOY] |

## What This Does

**Level 1:** A Compact counter contract with public ledger state and a private witness. Demonstrates the core ZK proof workflow — the caller proves they hold a valid positive witness, and the on-chain counter increments by 1. The witness value itself is never revealed.

**Level 4 (coming):** A private voting/poll system where vote tallies are publicly auditable on-chain but individual choices remain private. Nullifier-based double-vote prevention ensures one vote per identity per poll.

## Privacy Model

- **PUBLIC** (on-chain, visible to anyone): counter value; poll tallies; nullifier set (hashes only)
- **PRIVATE** (private witness, never on-chain): the witness value; voter key; chosen option index
- **PROVED without revealing**: that the caller holds a valid positive witness; that a voter has not previously voted in a given poll

## Tech Stack

- [Midnight Network](https://midnight.network) — privacy-preserving blockchain
- [Compact](https://docs.midnight.network/compact/reference/compact-reference) — smart contract language
- Node.js v22
- Docker (proof server on port 6300)
- React + Vite (Level 2+)
- [Midnight.js SDK](https://docs.midnight.network) — browser ZK proof generation
- Lace wallet (Level 2+)
- GitHub Actions CI/CD

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v22+ | https://nodejs.org |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| Compact compiler (`compactc`) | 0.31.0+ | See below |
| Lace wallet | latest | https://www.lace.io (Level 2+ only) |

### Installing the Compact Compiler

The Compact compiler is a native binary — **not** an npm package. Install it from the Midnight docs:

```
https://docs.midnight.network/getting-started/installation
```

After install, verify it works:

```bash
compactc --version
```

### Starting the Proof Server (Docker)

```bash
docker pull midnightnetwork/proof-server
docker run -p 6300:6300 midnightnetwork/proof-server
```

## Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd midnight-privacy-dapp

# 2. Install Node.js dependencies
npm install

# 3. Compile the counter contract (requires compactc installed)
compactc contracts/counter/counter.compact --output contracts/counter/artifacts/

# 4. (Level 2+) Start the proof server
docker run -p 6300:6300 midnightnetwork/proof-server

# 5. (Level 2+) Run the frontend dev server
npm run dev --workspace=frontend
```

## Run Tests

```bash
# Run all tests from root
npm test

# Run counter contract tests only
npm test --workspace=contracts/counter
```

All 5 counter contract tests pass:
- `initial counter state is 0`
- `increments counter by exactly 1 on valid witness`
- `rejects invalid witness (zero) without changing counter state`
- **Property 1**: increment is always exactly +1 regardless of witness value (100 runs)
- **Property 2**: any witness ≤ 0 is always rejected, state unchanged (100 runs)

## CI/CD

GitHub Actions runs on every push and pull request:
1. Installs Node.js v22
2. Runs `npm ci`
3. Compiles both contracts with `compactc`
4. Runs the full test suite with `npm test`

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Initial Idea

[LEAVE PLACEHOLDER — I will fill this in manually]

## Screenshots

[LEAVE PLACEHOLDER — I will add compile output and contract address screenshots]
