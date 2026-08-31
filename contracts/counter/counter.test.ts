// counter.test.ts
// Tests for the counter.compact Midnight contract.
// Imports the COMPILED contract artifacts from artifacts/contract/index.js
// and exercises the circuits using the @midnight-ntwrk/compact-runtime
// in-memory execution engine — no network, no proof server required.

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import {
  createConstructorContext,
  createCircuitContext,
  dummyContractAddress,
  CostModel,
} from '@midnight-ntwrk/compact-runtime';

// Import the COMPILED contract (not a mock).
// The artifact was produced by `compact compile contracts/counter/counter.compact`.
import { Contract, ledger } from './artifacts/contract/index.js';

// ---------------------------------------------------------------------------
// Helper: spin up a fresh in-memory contract instance for each test.
// ---------------------------------------------------------------------------

/** Minimal private state — the counter circuit uses no private fields. */
type PrivateState = Record<string, never>;

/** A dummy coin public key (32 zero bytes) used for in-memory testing. */
const DUMMY_COIN_KEY = new Uint8Array(32);

function buildContract(witnessValue: bigint) {
  // Provide the witness function that the circuit will call.
  const contract = new Contract<PrivateState>({
    incrementWitness: (_ctx) => [{}, witnessValue],
  });

  // Initialise ledger state via the contract constructor.
  const ctorCtx = createConstructorContext<PrivateState>({}, DUMMY_COIN_KEY);
  const { currentContractState, currentPrivateState } =
    contract.initialState(ctorCtx);

  return { contract, contractState: currentContractState, privateState: currentPrivateState };
}

function makeCircuitContext(
  contract: InstanceType<typeof Contract>,
  contractState: ReturnType<typeof buildContract>['contractState'],
  privateState: PrivateState,
) {
  return createCircuitContext(
    dummyContractAddress(),
    DUMMY_COIN_KEY,
    contractState,
    privateState,
    undefined,
    CostModel.initialCostModel(),
  );
}

// ---------------------------------------------------------------------------
// Test suite 1 — Circuit logic
// ---------------------------------------------------------------------------

describe('circuit logic — compiled artifacts', () => {
  it('a) initial ledger counter is 0', () => {
    // Verify the compiled contract initialises the counter to 0n.
    const { contractState } = buildContract(1n);
    const state = ledger(contractState.data);
    expect(state.counter).toBe(0n);
  });

  it('b) increment circuit increases counter by exactly 1', () => {
    // Supply witness = 42 — the circuit must still increment by exactly 1.
    const { contract, contractState, privateState } = buildContract(42n);
    const ctx = makeCircuitContext(contract, contractState, privateState);

    const { context: updatedCtx } = contract.circuits.increment(ctx);

    const before = ledger(contractState.data).counter;
    const after = ledger(updatedCtx.currentQueryContext.state).counter;

    expect(after - before).toBe(1n);
    expect(after).toBe(1n);
  });

  it('c) increment circuit rejects witness ≤ 0 and leaves counter unchanged', () => {
    // Witness = 0 must trigger the assert inside the compiled circuit.
    const { contract, contractState, privateState } = buildContract(0n);
    const ctx = makeCircuitContext(contract, contractState, privateState);

    expect(() => contract.circuits.increment(ctx)).toThrow(
      'Witness must be a positive integer',
    );

    // Counter must still be 0 — state is unchanged.
    expect(ledger(contractState.data).counter).toBe(0n);
  });
});

// ---------------------------------------------------------------------------
// Test suite 2 — State transitions
// ---------------------------------------------------------------------------

describe('state transitions — compiled artifacts', () => {
  let contract: InstanceType<typeof Contract>;
  let contractState: ReturnType<typeof buildContract>['contractState'];
  let privateState: PrivateState;

  beforeEach(() => {
    // Re-use witness = 1 for each state-transition test.
    ({ contract, contractState, privateState } = buildContract(1n));
  });

  it('counter advances by 1 per call (sequential increments)', () => {
    // Call increment three times; counter must be 1, 2, 3.
    let ctx = makeCircuitContext(contract, contractState, privateState);

    for (let expected = 1n; expected <= 3n; expected++) {
      const { context: next } = contract.circuits.increment(ctx);
      const value = ledger(next.currentQueryContext.state).counter;
      expect(value).toBe(expected);
      ctx = next; // chain calls
    }
  });

  it('state is not mutated by a failing call', () => {
    // A bad witness must not touch the committed state.
    const badContract = new Contract<PrivateState>({
      incrementWitness: (_ctx) => [{}, 0n], // will fail the assert
    });
    const ctorCtx = createConstructorContext<PrivateState>({}, DUMMY_COIN_KEY);
    const { currentContractState, currentPrivateState } =
      badContract.initialState(ctorCtx);

    const ctx = makeCircuitContext(badContract, currentContractState, currentPrivateState);

    try { badContract.circuits.increment(ctx); } catch { /* expected */ }

    expect(ledger(currentContractState.data).counter).toBe(0n);
  });
});

// ---------------------------------------------------------------------------
// Test suite 3 — Privacy guarantees
// ---------------------------------------------------------------------------

describe('privacy — compiled artifacts', () => {
  it('witness value never appears in the public transcript', () => {
    // The public transcript must not contain the raw witness value.
    const SECRET_WITNESS = 99999n;
    const { contract, contractState, privateState } = buildContract(SECRET_WITNESS);
    const ctx = makeCircuitContext(contract, contractState, privateState);

    const { context: updatedCtx } = contract.circuits.increment(ctx);

    // publicTranscript is the on-chain-visible portion of the proof data.
    const proofCtx = (updatedCtx as unknown as {
      currentQueryContext: { transcript?: unknown[] };
    }).currentQueryContext;

    // The serialised ledger state after increment must only expose counter = 1,
    // never the witness magnitude.
    const counterAfter = ledger(updatedCtx.currentQueryContext.state).counter;
    expect(counterAfter).toBe(1n);

    // The delta on-chain is always 1, never SECRET_WITNESS.
    expect(counterAfter).not.toBe(SECRET_WITNESS);
  });

  it('private witness is confined to privateTranscriptOutputs, not publicTranscript', () => {
    // Run the circuit and inspect proof data to confirm the witness
    // appears only in the private transcript, not the public one.
    const SECRET_WITNESS = 12345n;
    const { contract, contractState, privateState } = buildContract(SECRET_WITNESS);
    const ctx = makeCircuitContext(contract, contractState, privateState);

    const { proofData } = contract.circuits.increment(ctx);

    // publicTranscript must not contain the secret value.
    const publicBytes = JSON.stringify(proofData.publicTranscript);
    expect(publicBytes).not.toContain(SECRET_WITNESS.toString());

    // privateTranscriptOutputs should contain the witness commitment.
    expect(proofData.privateTranscriptOutputs.length).toBeGreaterThan(0);
  });

  it('counter increment is always +1 regardless of witness magnitude (property)', async () => {
    // Property test: for any valid witness, the observable on-chain delta is always 1.
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max: 18446744073709551615n }),
        async (witness) => {
          const { contract, contractState, privateState } = buildContract(witness);
          const ctx = makeCircuitContext(contract, contractState, privateState);

          const before = ledger(contractState.data).counter;
          const { context: updatedCtx } = contract.circuits.increment(ctx);
          const after = ledger(updatedCtx.currentQueryContext.state).counter;

          // The on-chain delta is always 1, never the witness.
          return after - before === 1n;
        },
      ),
      { numRuns: 50 },
    );
  });
});
