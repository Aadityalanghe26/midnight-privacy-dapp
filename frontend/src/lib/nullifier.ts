/**
 * nullifier.ts
 *
 * Client-side nullifier store for the private voting contract.
 *
 * A nullifier is a deterministic commitment that proves "this voter cast a
 * ballot in this poll" without revealing the voter's identity. We store
 * nullifiers locally (localStorage) so the UI can immediately show an
 * "already voted" state before the on-chain state is queried.
 *
 * PRIVACY NOTE:
 *   The storage key is a SHA-256 hash of `pollId + voterKey`, not the raw
 *   values. This prevents the key names themselves from leaking the voter's
 *   identity to any script that enumerates localStorage.
 *
 * Storage key format:
 *   midnight:nullifier:{hex(sha256(pollId + voterKey))}
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Public interface for the nullifier store.
 * All methods are async to allow a future implementation backed by IndexedDB
 * or a secure enclave without changing call sites.
 */
export interface NullifierStore {
  /**
   * Record that `voterKey` has voted in `pollId`.
   * Idempotent — calling it twice for the same pair is safe.
   */
  recordVote(pollId: string, voterKey: string): Promise<void>;

  /**
   * Return `true` if a vote has already been recorded for this pair.
   */
  hasVoted(pollId: string, voterKey: string): Promise<boolean>;

  /**
   * Remove all nullifier entries written by this store.
   * Useful for testing and for the "reset" dev-tools panel.
   * Does NOT affect unrelated localStorage keys.
   */
  clearAll(): Promise<void>;
}

// ─── Storage key helpers ──────────────────────────────────────────────────────

const STORAGE_PREFIX = 'midnight:nullifier:';

/**
 * Derive a deterministic storage key from a poll ID and voter key.
 *
 * Uses the Web Crypto API (available in all modern browsers and Node ≥ 19
 * with `globalThis.crypto`). Falls back to a simple concatenation hash for
 * environments where SubtleCrypto is unavailable (e.g., older test runtimes).
 */
async function deriveStorageKey(pollId: string, voterKey: string): Promise<string> {
  const raw = `${pollId}${voterKey}`;

  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${STORAGE_PREFIX}${hashHex}`;
  }

  // Fallback: simple djb2-style hash (not cryptographic, only used when
  // SubtleCrypto is absent — e.g., jest/vitest with jsdom < 20).
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return `${STORAGE_PREFIX}${hash.toString(16).padStart(8, '0')}`;
}

// ─── localStorage implementation ──────────────────────────────────────────────

/**
 * Concrete NullifierStore backed by `localStorage`.
 *
 * Use `createNullifierStore()` to obtain an instance rather than
 * constructing this class directly.
 */
class LocalStorageNullifierStore implements NullifierStore {
  async recordVote(pollId: string, voterKey: string): Promise<void> {
    const key = await deriveStorageKey(pollId, voterKey);
    localStorage.setItem(key, '1');
  }

  async hasVoted(pollId: string, voterKey: string): Promise<boolean> {
    const key = await deriveStorageKey(pollId, voterKey);
    return localStorage.getItem(key) === '1';
  }

  async clearAll(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}

// ─── In-memory implementation (for tests / SSR) ───────────────────────────────

/**
 * In-memory NullifierStore that does not depend on `localStorage`.
 * Useful in unit tests and server-side rendering contexts.
 */
class InMemoryNullifierStore implements NullifierStore {
  private readonly store = new Set<string>();

  async recordVote(pollId: string, voterKey: string): Promise<void> {
    const key = await deriveStorageKey(pollId, voterKey);
    this.store.add(key);
  }

  async hasVoted(pollId: string, voterKey: string): Promise<boolean> {
    const key = await deriveStorageKey(pollId, voterKey);
    return this.store.has(key);
  }

  async clearAll(): Promise<void> {
    this.store.clear();
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create the appropriate NullifierStore for the current environment.
 *
 * - Browser with localStorage → LocalStorageNullifierStore (persistent)
 * - Node.js / test environment → InMemoryNullifierStore (ephemeral)
 */
export function createNullifierStore(): NullifierStore {
  if (typeof localStorage !== 'undefined') {
    return new LocalStorageNullifierStore();
  }
  return new InMemoryNullifierStore();
}

/**
 * Singleton instance for use throughout the app.
 * Import this directly rather than calling createNullifierStore() each time.
 *
 * @example
 * import { nullifierStore } from './lib/nullifier';
 * await nullifierStore.recordVote(pollId, voterKey);
 */
export const nullifierStore: NullifierStore = createNullifierStore();
