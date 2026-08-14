# Midnight Privacy dApp

> A privacy-preserving dApp on the Midnight network — on-chain tallies are publicly auditable, individual votes stay private via zero-knowledge proofs.

---

## Initial Idea

Most blockchain voting systems expose your vote publicly. Anyone can see who voted for what, enabling coercion and bribery.

This project uses Midnight Network's zero-knowledge proofs to make votes genuinely private. The blockchain records *that* you voted and *which tally increased* — but never *which option you chose*. The proof is generated locally in your browser. A nullifier hash prevents double-voting while keeping your identity private.

The result: vote tallies are fully auditable and tamper-proof, but individual choices are mathematically guaranteed to remain secret — not just hidden by policy.

---

## Contract Address

| Network | Contract Address |
|---------|-----------------|
| Local devnet | `749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d` |
| Preview | *(deploy in progress)* |
| Preprod | *(deploy in progress)* |

---

## What This Does

**Level 1 — Counter Contract (complete)**
A Compact counter contract with public ledger state and a private witness. The caller proves they hold a valid positive witness; the on-chain counter increments by 1. The witness value is never revealed.

**Level 2 — React Frontend (in progress)**
React + Vite frontend with Lace wallet integration. The useWallet hook manages the connect/disconnect state machine.

**Level 4 — Private Voting (planned)**
A voting contract where tallies are on-chain and auditable, but individual choices stay private. Nullifier system prevents double-voting without revealing voter identity.


---

## Privacy Model

| Layer | Visibility |
|-------|-----------|
| Counter value / poll tallies | **Public** — on-chain, visible to anyone |
| Nullifier set | **Public** — only hashes, not voter keys |
| Private witness value | **Private** — never leaves your machine |
| Voter key / chosen option | **Private** — proved without revealing |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Compact on Midnight Network |
| ZK proof generation | Midnight.js SDK + local proof server (Docker) |
| Frontend | React 18 + Vite + TypeScript |
| Wallet | Lace (Midnight extension) |
| Testing | Vitest + fast-check (property-based) |
| CI/CD | GitHub Actions |
| Runtime | Node.js v22 |


---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v22+ | https://nodejs.org |
| Docker Desktop | latest | https://docker.com/products/docker-desktop |
| Compact compiler (compactc) | 0.31.1+ | https://docs.midnight.network/getting-started/installation |
| Lace wallet | latest | https://www.lace.io (Level 2+ only) |

---

## Setup

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/midnight-privacy-dapp.git
cd midnight-privacy-dapp

# 2. Install dependencies
npm install

# 3. Compile the counter contract
compactc contracts/counter/counter.compact contracts/counter/artifacts/

# 4. Run tests
npm test
```


---

## Run Tests

```bash
npm test
npm test --workspace=contracts/counter
```

All 5 tests pass:

| Test | Type |
|------|------|
| Initial counter state is 0 | Unit |
| Increments counter by exactly 1 on valid witness | Unit |
| Rejects invalid witness (zero) without changing state | Unit |
| Property 1: increment always exactly +1 | Property (100 runs) |
| Property 2: any witness <= 0 always rejected | Property (100 runs) |


---

## Project Structure

```
midnight-privacy-dapp/
├── contracts/
│   ├── counter/
│   │   ├── counter.compact       # Level 1 counter contract
│   │   ├── counter.test.ts       # Unit + property tests
│   │   └── artifacts/            # Compiled output (gitignored)
│   └── voting/
│       └── voting.compact        # Level 4 voting contract (planned)
├── frontend/
│   └── src/lib/
│       ├── midnight-client.ts    # Midnight.js SDK wrapper
│       ├── nullifier.ts          # Vote deduplication store
│       └── index.ts              # Barrel export
├── docs/
├── .github/workflows/ci.yml
└── README.md
```


---

## Screenshots

### All Tests Passing

```
 ✓ counter.test.ts (5)
   ✓ counter.compact (3)
     ✓ initial counter state is 0
     ✓ increments counter by exactly 1 on valid witness
     ✓ rejects invalid witness (zero) without changing counter state
   ✓ counter.compact — property tests (2)
     ✓ Property 1: increment is always exactly +1 regardless of witness value
     ✓ Property 2: any witness <= 0 is always rejected, state unchanged
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### Local Devnet Deployment

```
✅ Contract deployed successfully!
Contract Address: 749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d
Saved to .midnight-state.json
```

---

## License

MIT
