// NullifierStore — records and checks whether a voter has voted in a poll.
// Uses SubtleCrypto SHA-256 for the storage key, with a djb2 fallback for environments
// that lack the Web Crypto API (e.g., Node test runners without jsdom).

export interface NullifierStore {
  recordVote(pollId: string, voterKey: string): Promise<void>;
  hasVoted(pollId: string, voterKey: string): Promise<boolean>;
  clearAll(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Hashing helpers
// ---------------------------------------------------------------------------

async function sha256Hex(input: string): Promise<string> {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    globalThis.crypto.subtle
  ) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // djb2 fallback
  return djb2(input);
}

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return hash.toString(16).padStart(8, '0');
}

async function storageKey(pollId: string, voterKey: string): Promise<string> {
  const hex = await sha256Hex(pollId + voterKey);
  return `midnight:nullifier:${hex}`;
}

// ---------------------------------------------------------------------------
// LocalStorageNullifierStore — for browsers
// ---------------------------------------------------------------------------

export class LocalStorageNullifierStore implements NullifierStore {
  async recordVote(pollId: string, voterKey: string): Promise<void> {
    const key = await storageKey(pollId, voterKey);
    localStorage.setItem(key, '1');
  }

  async hasVoted(pollId: string, voterKey: string): Promise<boolean> {
    const key = await storageKey(pollId, voterKey);
    return localStorage.getItem(key) === '1';
  }

  async clearAll(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('midnight:nullifier:')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}

// ---------------------------------------------------------------------------
// InMemoryNullifierStore — for Node / tests
// ---------------------------------------------------------------------------

export class InMemoryNullifierStore implements NullifierStore {
  private readonly store = new Set<string>();

  async recordVote(pollId: string, voterKey: string): Promise<void> {
    const key = await storageKey(pollId, voterKey);
    this.store.add(key);
  }

  async hasVoted(pollId: string, voterKey: string): Promise<boolean> {
    const key = await storageKey(pollId, voterKey);
    return this.store.has(key);
  }

  async clearAll(): Promise<void> {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Factory + singleton
// ---------------------------------------------------------------------------

export function createNullifierStore(): NullifierStore {
  if (typeof localStorage !== 'undefined') {
    return new LocalStorageNullifierStore();
  }
  return new InMemoryNullifierStore();
}

export const nullifierStore: NullifierStore = createNullifierStore();
