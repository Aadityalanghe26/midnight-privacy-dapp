import { useWallet } from '../hooks/useWallet';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';

export function WalletConnector() {
  const { wallet, connect, disconnect } = useWallet();
  const { status, address, error } = wallet;

  const midnightAvailable =
    typeof window !== 'undefined' &&
    !!(window as unknown as Record<string, unknown>).midnight;

  const showInstallBanner = !midnightAvailable && status !== 'connected';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Wallet</h2>

      {showInstallBanner && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Midnight wallet not detected.{' '}
          <a
            href="https://www.lace.io/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="install-lace-link"
          >
            Install Lace
          </a>{' '}
          to get started.
        </div>
      )}

      {status === 'error' && (
        <ErrorBanner message={error} />
      )}

      {status === 'connected' && address ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Connected as{' '}
            <span
              className="font-mono"
              data-testid="wallet-address"
              style={{
                color: 'var(--color-text-primary)',
                wordBreak: 'break-all',
              }}
            >
              {address}
            </span>
          </div>
          <button
            className="btn btn-ghost"
            data-testid="disconnect-btn"
            onClick={disconnect}
            style={{ alignSelf: 'flex-start' }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="btn btn-primary"
          data-testid="connect-btn"
          onClick={() => void connect()}
          disabled={status === 'connecting'}
          style={{ alignSelf: 'flex-start' }}
        >
          {status === 'connecting' ? (
            <>
              <LoadingSpinner size="sm" />
              Connecting…
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>
      )}
    </div>
  );
}
