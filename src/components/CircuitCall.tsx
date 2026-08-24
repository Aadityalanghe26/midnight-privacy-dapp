import React from 'react';
import { useMidnight } from '../hooks/useMidnight';

export interface CircuitCallProps {
  witnessInput?: number;
}

export const CircuitCall: React.FC<CircuitCallProps> = ({ witnessInput = 42 }) => {
  const { wallet, circuitState, executeCircuit, contractAddress } = useMidnight();
  const { isExecuting, proofGenerated, txHash, ledgerValue, error, lastExecutedAt } = circuitState;

  const handleExecute = () => {
    executeCircuit(witnessInput);
  };

  return (
    <div className="circuit-call-card" style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f3f4f6' }}>
          Execute Contract Circuit
        </h3>
        <span
          data-testid="privacy-label"
          style={{
            fontSize: '0.75rem',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontWeight: 600,
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            border: '1px solid rgba(165, 180, 252, 0.3)'
          }}
        >
          Proved without revealing your input
        </span>
      </div>

      <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#9ca3af' }}>Contract Address:</span>
          <span style={{ fontFamily: 'monospace', color: '#38bdf8' }} data-testid="contract-address">
            {contractAddress.slice(0, 10)}...{contractAddress.slice(-6)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9ca3af' }}>On-Chain Counter State:</span>
          <span style={{ fontWeight: 700, color: '#34d399', fontSize: '1rem' }} data-testid="ledger-value">
            {ledgerValue}
          </span>
        </div>
      </div>

      <button
        onClick={handleExecute}
        disabled={isExecuting || wallet.status !== 'connected'}
        data-testid="circuit-btn"
        style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: '8px',
          border: 'none',
          background: isExecuting
            ? '#374151'
            : wallet.status !== 'connected'
            ? '#4b5563'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: isExecuting || wallet.status !== 'connected' ? 'not-allowed' : 'pointer',
          boxShadow: isExecuting || wallet.status !== 'connected' ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
          transition: 'all 0.2s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {isExecuting ? (
          <>
            <span style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              borderTopColor: '#ffffff',
              animation: 'spin 1s ease-in-out infinite'
            }} />
            <span>Generating ZK Proof in Browser...</span>
          </>
        ) : (
          'Execute Circuit (Generate ZK Proof)'
        )}
      </button>

      {wallet.status !== 'connected' && (
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px', textAlign: 'center' }}>
          Connect your Lace wallet above to enable circuit execution.
        </p>
      )}

      {isExecuting && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#93c5fd',
          fontSize: '0.875rem'
        }} data-testid="loading-state">
          🔒 Generating zero-knowledge proof locally... Your private witness is safe on your device and will never be exposed.
        </div>
      )}

      {proofGenerated && !isExecuting && txHash && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          color: '#6ee7b7',
          fontSize: '0.875rem'
        }} data-testid="tx-result">
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>
            ✅ ZK Proof Verified & Transaction Submitted On-Chain!
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>
            Transaction Hash:
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8', wordBreak: 'break-all' }}>
            {txHash}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>
            Submitted at {lastExecutedAt} · Public tally increased by 1 · Private input remained secret.
          </div>
        </div>
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
        }} data-testid="circuit-error">
          {error}
        </div>
      )}
    </div>
  );
};
