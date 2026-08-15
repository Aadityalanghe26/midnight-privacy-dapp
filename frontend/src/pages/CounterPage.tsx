import { WalletConnector } from '../components/WalletConnector';
import { CounterWidget } from '../components/CounterWidget';

export function CounterPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <header style={{ marginBottom: 'var(--space-10)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Midnight{' '}
          <span style={{ color: 'var(--color-accent)' }}>Privacy dApp</span>
        </h1>
        <p
          className="text-secondary"
          style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-md)' }}
        >
          A zero-knowledge counter on the Midnight Network
        </p>
      </header>

      <main
        style={{
          display: 'grid',
          gap: 'var(--space-6)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          maxWidth: '800px',
        }}
      >
        <section aria-labelledby="wallet-heading">
          <span id="wallet-heading" className="sr-only">Wallet connection</span>
          <WalletConnector />
        </section>

        <section aria-labelledby="counter-heading">
          <span id="counter-heading" className="sr-only">Counter widget</span>
          <CounterWidget />
        </section>
      </main>
    </div>
  );
}
