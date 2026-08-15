// Barrel re-export for frontend/src/lib

export type { NullifierStore } from './nullifier';
export {
  LocalStorageNullifierStore,
  InMemoryNullifierStore,
  createNullifierStore,
  nullifierStore,
} from './nullifier';

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
