import React from 'react';
import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';

export function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <header style={{ maxWidth: '900px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#818cf8',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          Midnight Builder Challenge · Level 2
        </div>

        <h1 style={{
          fontSize: '2.75rem',
          fontWeight: 800,
          margin: '0 0 16px 0',
          background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Midnight Privacy dApp
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: '#94a3b8',
          maxWidth: '650px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          A privacy-preserving Web3 application built on the Midnight Network. Zero-knowledge proofs keep private witnesses secret while verifying public state transitions on-chain.
        </p>
      </header>

      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '24px'
      }}>
        <section>
          <WalletConnect />
        </section>

        <section>
          <CircuitCall />
        </section>
      </main>
    </div>
  );
}

export default App;
