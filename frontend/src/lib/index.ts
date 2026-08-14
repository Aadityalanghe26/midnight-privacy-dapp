/**
 * frontend/src/lib/index.ts
 *
 * Barrel export for the frontend library layer.
 * Import everything from here rather than reaching into individual modules.
 *
 * @example
 * import { deployCounter, increment, nullifierStore } from '../lib';
 */

// ─── Midnight client (counter contract SDK wrapper) ───────────────────────────
export type {
  MidnightClientConfig,
  DeployCounterResult,
  IncrementResult,
} from './midnight-client';

export {
  deployCounter,
  getCounterState,
  increment,
} from './midnight-client';

// ─── Nullifier store (vote deduplication) ─────────────────────────────────────
export type { NullifierStore } from './nullifier';

export {
  createNullifierStore,
  nullifierStore,
} from './nullifier';
