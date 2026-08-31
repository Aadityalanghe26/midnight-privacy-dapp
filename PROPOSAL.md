# Product Proposal

## What is the product, and who uses it?
A privacy-preserving counter dApp built on the Midnight Network. Users connect their Lace wallet, supply a private witness locally in the browser, and submit a ZK proof that increments an on-chain counter — without ever revealing the witness value. The primary users are developers exploring Midnight's privacy primitives and end users who want verifiable on-chain actions without exposing their inputs. It serves as a reference implementation for any dApp where a user needs to prove eligibility or intent without disclosing the underlying data.

## Why Midnight specifically?
On a transparent chain like Ethereum, every input to a smart contract is publicly visible on-chain. For this product, the witness value — which represents a user's private input — must remain completely hidden. Midnight makes this possible because ZK proofs are generated entirely in the browser using the compact-runtime, the private witness never leaves the user's device, and only the proof of its validity is submitted on-chain. No transparent chain could achieve this without exposing the input in the calldata or relying on a trusted off-chain service. Midnight's native ZK architecture means privacy is enforced at the protocol level, not bolted on.

## Data Model
| Data Point        | Type            | Disclosed To |
|-------------------|-----------------|--------------|
| Counter value     | Public ledger   | Everyone     |
| Transaction hash  | Public ledger   | Everyone     |
| ZK proof validity | Public ledger   | Everyone     |
| Witness value     | Private witness | No one       |
| Witness magnitude | Private witness | No one       |
| User address      | Public ledger   | Everyone     |

## Mainnet Feasibility
Yes — this is realistic to reach Mainnet by Level 6. The Compact contract is already compiled and deployed on Preprod, the frontend is live on Netlify, and the full ZK proof pipeline (witness → proof → on-chain increment) is wired end-to-end. The remaining work is proof server integration for production, wallet UX hardening, and final security review. None of these are blockers — they are standard productionisation steps achievable within the Level 4–6 timeline.
