import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletConnect } from './WalletConnect';
import * as useWalletModule from '../hooks/useWallet';

vi.mock('../hooks/useWallet', () => ({
  useWallet: vi.fn(),
}));

describe('WalletConnect Component', () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders connect button when disconnected', () => {
    vi.spyOn(useWalletModule, 'useWallet').mockReturnValue({
      wallet: { status: 'disconnected', address: null, error: null },
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    render(<WalletConnect />);
    expect(screen.getByTestId('connect-btn')).toBeInTheDocument();
    expect(screen.getByText('Connect Lace Wallet')).toBeInTheDocument();
  });

  it('renders wallet address and disconnect button when connected', () => {
    vi.spyOn(useWalletModule, 'useWallet').mockReturnValue({
      wallet: { status: 'connected', address: '0x1234567890abcdef1234567890abcdef', error: null },
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    render(<WalletConnect />);
    expect(screen.getByTestId('wallet-address')).toBeInTheDocument();
    expect(screen.getByTestId('disconnect-btn')).toBeInTheDocument();
  });

  it('triggers connect callback when Connect button is clicked', () => {
    vi.spyOn(useWalletModule, 'useWallet').mockReturnValue({
      wallet: { status: 'disconnected', address: null, error: null },
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    render(<WalletConnect />);
    fireEvent.click(screen.getByTestId('connect-btn'));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('triggers disconnect callback when Disconnect button is clicked', () => {
    vi.spyOn(useWalletModule, 'useWallet').mockReturnValue({
      wallet: { status: 'connected', address: '0x1234567890abcdef', error: null },
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    render(<WalletConnect />);
    fireEvent.click(screen.getByTestId('disconnect-btn'));
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
