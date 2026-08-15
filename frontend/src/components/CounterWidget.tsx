import { useState } from 'react';
import { useCounter } from '../hooks/useCounter';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';

export function CounterWidget() {
  const { counter, loading, error, increment } = useCounter();
  const [witnessInput, setWitnessInput] = useState<string>('1');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const parsed = BigInt(witnessInput.trim() || '0');
    if (parsed <= 0n) {
      setLocalError('Witness value must be a positive integer.');
      return;
    }

    await increment(parsed);
  };

  const displayError = localError ?? error;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Counter</h2>

      <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
        <span
          style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 700,
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
          }}
        >
          {counter === null ? (
            loading ? <LoadingSpinner size="lg" /> : '—'
          ) : (
            counter.toString()
          )}
        </span>
        <p
          className="text-secondary"
          style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}
        >
          on-chain value
        </p>
      </div>

      {displayError && (
        <ErrorBanner
          message={displayError}
          onDismiss={() => setLocalError(null)}
        />
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <label htmlFor="witness-input" className="sr-only">
          Witness value
        </label>
        <input
          id="witness-input"
          data-testid="witness-input"
          type="number"
          min={1}
          value={witnessInput}
          onChange={(e) => setWitnessInput(e.target.value)}
          disabled={loading}
          style={{ width: '120px' }}
          aria-label="Witness value"
        />
        <button
          className="btn btn-primary"
          data-testid="increment-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Incrementing…
            </>
          ) : (
            'Increment'
          )}
        </button>
      </form>
    </div>
  );
}
