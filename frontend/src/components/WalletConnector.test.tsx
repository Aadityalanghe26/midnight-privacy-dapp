import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletConnector } from './WalletConnector';
import type { UseWallet } from '../hooks/useWallet';

vi.mock('../hooks/useWallet', () => ({ useWallet: vi.fn() }));

import { useWallet } from '../hooks/useWallet';

const mockUseWallet = useWallet as ReturnType<typeof vi.fn>;

function setupMock(overrides: Partial<UseWallet>) {
  const defaults: UseWallet = {
    wallet: { status: 'disconnected', address: null, error: null },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  mockUseWallet.mockReturnValue({ ...defaults, ...overrides });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Ensure window.midnight is absent unless test sets it
  delete (window as unknown as Record<string, unknown>).midnight;
});

describe('WalletConnector', () => {
  it('renders connect button when disconnected', () => {
    setupMock({
      wallet: { status: 'disconnected', address: null, error: null },
    });
    render(<WalletConnector />);
    expect(screen.getByTestId('connect-btn')).toBeInTheDocument();
  });

  it('renders wallet address when connected', () => {
    setupMock({
      wallet: {
        status: 'connected',
        address: 'addr_midnight_test_abc123',
        error: null,
      },
    });
    render(<WalletConnector />);
    expect(screen.getByTestId('wallet-address')).toHaveTextContent(
      'addr_midnight_test_abc123',
    );
    expect(screen.getByTestId('disconnect-btn')).toBeInTheDocument();
  });

  it('shows install Lace link when window.midnight is absent', () => {
    setupMock({
      wallet: { status: 'disconnected', address: null, error: null },
    });
    render(<WalletConnector />);
    expect(screen.getByTestId('install-lace-link')).toBeInTheDocument();
  });

  it('disables connect button while connecting', () => {
    setupMock({
      wallet: { status: 'connecting', address: null, error: null },
    });
    render(<WalletConnector />);
    const btn = screen.getByTestId('connect-btn');
    expect(btn).toBeDisabled();
  });

  it('calls connect when button is clicked', () => {
    const connect = vi.fn();
    setupMock({
      wallet: { status: 'disconnected', address: null, error: null },
      connect,
    });
    render(<WalletConnector />);
    fireEvent.click(screen.getByTestId('connect-btn'));
    expect(connect).toHaveBeenCalledOnce();
  });
});
