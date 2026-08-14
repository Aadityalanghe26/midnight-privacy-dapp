// counter.test.ts
// Tests for the counter.compact Midnight contract
// Uses Vitest with a simulated contract state (real Midnight.js integration requires compiled artifacts)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// --- Simulated contract state (mirrors counter.compact ledger) ---
// When real Midnight.js artifacts are available, replace this simulation
// with the actual Midnight.js in-memory provider and compiled circuit.

interface CounterLedger {
  counter: bigint;
}

interface CounterContract {
  getLedger(): CounterLedger;
  increment(witness: bigint): Promise<bigint>; // returns new counter value
}

function createMockCounterContract(): CounterContract {
  const ledger: CounterLedger = { counter: 0n };

  return {
    getLedger: () => ({ ...ledger }),
    increment: async (witness: bigint): Promise<bigint> => {
      // Mirror the Compact circuit assertions:
      // assert w > 0 : "Witness must be a positive integer"
      if (witness <= 0n) {
        throw new Error('Witness must be a positive integer');
      }
      // Counter increments by exactly 1 regardless of witness magnitude
      ledger.counter = ledger.counter + 1n;
      return ledger.counter; // mirrors disclose(ledger.counter)
    },
  };
}

describe('counter.compact', () => {
  let contract: CounterContract;

  beforeEach(() => {
    contract = createMockCounterContract();
  });

  it('initial counter state is 0', () => {
    // Requirement 2.1: public ledger state stores an integer counter
    // Requirement 2.4: initial state test case
    const ledger = contract.getLedger();
    expect(ledger.counter).toBe(0n);
  });

  it('increments counter by exactly 1 on valid witness', async () => {
    // Requirement 2.2: increment circuit accepts private witness and increments by exactly 1
    const before = contract.getLedger().counter;
    const newValue = await contract.increment(42n); // valid positive witness
    const after = contract.getLedger().counter;

    expect(after).toBe(before + 1n);
    expect(newValue).toBe(1n);
    expect(after - before).toBe(1n); // always exactly +1, never +witness
  });

  it('rejects invalid witness (zero) without changing counter state', async () => {
    // Requirement 2.5: invalid witness rejected, state unchanged
    const before = contract.getLedger().counter;

    await expect(contract.increment(0n)).rejects.toThrow(
      'Witness must be a positive integer'
    );

    const after = contract.getLedger().counter;
    expect(after).toBe(before); // state must be unchanged
  });
});

// =============================================================================
// Property tests (fast-check, min 100 runs each)
// =============================================================================

describe('counter.compact — property tests', () => {
  // ── Property 1: Counter Increment is Always Exactly One ──────────────────
  // No matter what positive witness is supplied, the counter must increase
  // by exactly 1. The witness value must never leak into the delta.
  it('Property 1: increment is always exactly +1 regardless of witness value', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate any positive BigInt in [1, 2^64-1]
        fc.bigInt({ min: 1n, max: 18446744073709551615n }),
        async (witness) => {
          const contract = createMockCounterContract();
          const before = contract.getLedger().counter;
          await contract.increment(witness);
          const after = contract.getLedger().counter;
          // Delta must always be exactly 1, never equal to the witness
          return after - before === 1n;
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── Property 2: Invalid Witnesses Are Always Rejected ────────────────────
  // Any witness ≤ 0 must be rejected and must leave the counter unchanged.
  // BigInt arbitraries in fast-check include 0n and negatives.
  it('Property 2: any witness ≤ 0 is always rejected, state unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate non-positive BigInts: 0 or any negative value
        fc.oneof(
          fc.constant(0n),
          fc.bigInt({ min: -18446744073709551615n, max: -1n }),
        ),
        async (witness) => {
          const contract = createMockCounterContract();
          const before = contract.getLedger().counter;
          let threw = false;
          try {
            await contract.increment(witness);
          } catch (e) {
            threw = true;
          }
          const after = contract.getLedger().counter;
          // Must have thrown AND counter must be unchanged
          return threw && after === before;
        },
      ),
      { numRuns: 100 },
    );
  });
});
