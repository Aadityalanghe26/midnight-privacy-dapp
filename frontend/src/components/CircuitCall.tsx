import { useState } from 'react';
import { useCounter } from '../hooks/useCounter';
import { useWallet } from '../hooks/useWallet';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';

// Private inputs are NEVER sent to the server or shown on-chain.
export function CircuitCall() {
  const { counter, loading, error, txHash, increment } = useCounter();
  const { wallet } = useWallet();
  const [witness, setWitness] = useState('1');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (wallet.status !== 'connected' || !wallet.api) {
      setLocalError('Please connect your Lace wallet first.');
      return;
    }

    const w = BigInt(witness || '0');
    if (w <= 0n) {
      setLocalError('Witness must be a positive integer.');
      return;
    }

    // Pass the real wallet API and address to the SDK call
    await increment(w, wallet.api, wallet.address ?? '');
  }

  return (
    <div className='card' style={{ maxWidth: 480 }}>
      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
        Counter Circuit
      </h2>
      <p className='text-secondary' style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
        🔒 Private witness — proved without revealing your input
      </p>

      <div style={{ textAlign: 'center', margin: 'var(--space-4) 0' }}>
        <span
          style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-accent)' }}
          aria-label='on-chain counter value'
        >
          {counter === null ? (loading ? <LoadingSpinner size='sm' /> : '—') : counter.toString()}
        </span>
        <p className='text-secondary' style={{ fontSize: 'var(--text-sm)' }}>
          on-chain value (PUBLIC)
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      >
        <label
          htmlFor='circuit-witness'
          style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}
        >
          Private witness{' '}
          <span style={{ fontStyle: 'italic' }}>(never shown on-chain — PRIVATE)</span>
        </label>
        <input
          id='circuit-witness'
          type='number'
          min='1'
          value={witness}
          onChange={(e) => setWitness(e.target.value)}
          disabled={loading}
          style={{ width: '100%' }}
          aria-label='Private witness value'
        />
        <button
          type='submit'
          className='btn btn-primary'
          disabled={loading || wallet.status !== 'connected'}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? (
            <>
              <LoadingSpinner size='sm' />
              <span style={{ marginLeft: 'var(--space-2)' }}>Generating ZK proof…</span>
            </>
          ) : (
            'Call Circuit'
          )}
        </button>
      </form>

      {/* Only show confirmation once a real txHash comes back from the network */}
      {txHash && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <p style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
            ✓ Transaction confirmed on-chain
          </p>
          <p style={{ color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
            <span style={{ fontWeight: 500 }}>Tx hash: </span>
            <span className='font-mono'>{txHash}</span>
          </p>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
            Your witness value was proved valid without being revealed on-chain.
          </p>
        </div>
      )}

      <ErrorBanner message={error ?? localError} onDismiss={() => setLocalError(null)} />
    </div>
  );
}
