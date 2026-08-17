import { useState } from 'react';
import { useCounter } from '../hooks/useCounter';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';

// Private inputs are NEVER shown in the UI.
export function CircuitCall() {
  const { counter, loading, error, increment } = useCounter();
  const [witness, setWitness] = useState('1');
  const [localError, setLocalError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLocalError(null); setTxResult(null);
    const w = BigInt(witness || '0');
    if (w <= 0n) { setLocalError('Witness must be positive'); return; }
    await increment(w);
    setTxResult('Transaction confirmed. Counter incremented on-chain.');
  }

  return (
    <div className='card' style={{ maxWidth: 480 }}>
      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Counter Circuit</h2>
      <p className='text-secondary' style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
        Proved without revealing your input
      </p>
      <div style={{ textAlign: 'center', margin: 'var(--space-4) 0' }}>
        <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-accent)' }}>
          {counter === null ? '-' : counter.toString()}
        </span>
        <p className='text-secondary' style={{ fontSize: 'var(--text-sm)' }}>on-chain value</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <label htmlFor='circuit-witness' style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Private witness (never shown on-chain)
        </label>
        <input id='circuit-witness' type='number' min='1' value={witness} onChange={e => setWitness(e.target.value)} disabled={loading} style={{ width: '100%' }} />
        <button type='submit' className='btn btn-primary' disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? <><LoadingSpinner size='sm' /><span>Generating ZK proof...</span></> : 'Call Circuit'}
        </button>
      </form>
      {txResult && <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>{txResult}</p>}
      <ErrorBanner message={error || localError} onDismiss={() => setLocalError(null)} />
    </div>
  );
}