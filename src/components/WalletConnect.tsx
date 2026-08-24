import React from 'react';
import { useWallet } from '../hooks/useWallet';

export interface WalletConnectProps {
  onConnectSuccess?: (address: string) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = () => {
  const { wallet, connect, disconnect } = useWallet();
  const { status, address, error } = wallet;

  const isWalletAvailable = typeof window !== 'undefined' && !!(window as any).midnight;

  return (
    <div className="wallet-connect-card" style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f3f4f6' }}>
          Lace Wallet Integration
        </h3>
        <span style={{
          fontSize: '0.75rem',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontWeight: 500,
          background: status === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: status === 'connected' ? '#34d399' : '#f87171',
          border: status === 'connected' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)'
        }}>
          {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>

      {!isWalletAvailable && status !== 'connected' && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '0.875rem',
          color: '#fde047'
        }} data-testid="wallet-warning">
          Lace wallet extension not detected.{' '}
          <a
            href="https://www.lace.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#60a5fa', textDecoration: 'underline' }}
          >
            Install Lace Wallet
          </a>
        </div>
      )}

      {status === 'connected' && address ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Wallet Address:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#60a5fa' }} data-testid="wallet-address">
              {address.length > 18 ? `${address.slice(0, 10)}...${address.slice(-6)}` : address}
            </span>
          </div>

          <button
            onClick={disconnect}
            data-testid="disconnect-btn"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={status === 'connecting'}
          data-testid="connect-btn"
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: status === 'connecting' ? '#4b5563' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: status === 'connecting' ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
            transition: 'transform 0.1s ease, box-shadow 0.2s ease'
          }}
        >
          {status === 'connecting' ? 'Connecting to Lace...' : 'Connect Lace Wallet'}
        </button>
      )}

      {error && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#fca5a5',
          fontSize: '0.875rem'
        }} data-testid="error-message">
          {error}
        </div>
      )}
    </div>
  );
};
