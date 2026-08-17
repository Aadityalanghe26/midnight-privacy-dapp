import { WalletConnect } from '../components/WalletConnect';
import { CircuitCall } from '../components/CircuitCall';

export function CounterPage() {
  return (
    <main className='container' style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Midnight Privacy dApp
        </h1>
        <p className='text-secondary'>Zero-knowledge proofs on the Midnight Network</p>
      </header>
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Wallet</h2>
        <WalletConnect />
      </section>
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Counter Contract</h2>
        <CircuitCall />
      </section>
    </main>
  );
}
