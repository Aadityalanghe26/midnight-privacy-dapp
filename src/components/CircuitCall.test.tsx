import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitCall } from './CircuitCall';
import * as useMidnightModule from '../hooks/useMidnight';

vi.mock('../hooks/useMidnight', () => ({
  useMidnight: vi.fn(),
}));

describe('CircuitCall Component', () => {
  const mockExecuteCircuit = vi.fn();
  const mockConnectWallet = vi.fn();
  const mockDisconnectWallet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mandatory privacy claim label "Proved without revealing your input"', () => {
    vi.spyOn(useMidnightModule, 'useMidnight').mockReturnValue({
      wallet: { status: 'connected', address: '0x123456', error: null },
      connectWallet: mockConnectWallet,
      disconnectWallet: mockDisconnectWallet,
      circuitState: {
        isExecuting: false,
        proofGenerated: false,
        txHash: null,
        ledgerValue: 5,
        error: null,
        lastExecutedAt: null,
      },
      executeCircuit: mockExecuteCircuit,
      contractAddress: '749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d',
    });

    render(<CircuitCall />);
    const privacyLabel = screen.getByTestId('privacy-label');
    expect(privacyLabel).toBeInTheDocument();
    expect(privacyLabel).toHaveTextContent('Proved without revealing your input');
  });

  it('displays loading state during local ZK proof generation', () => {
    vi.spyOn(useMidnightModule, 'useMidnight').mockReturnValue({
      wallet: { status: 'connected', address: '0x123456', error: null },
      connectWallet: mockConnectWallet,
      disconnectWallet: mockDisconnectWallet,
      circuitState: {
        isExecuting: true,
        proofGenerated: false,
        txHash: null,
        ledgerValue: 5,
        error: null,
        lastExecutedAt: null,
      },
      executeCircuit: mockExecuteCircuit,
      contractAddress: '749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d',
    });

    render(<CircuitCall />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText(/Generating ZK Proof in Browser/i)).toBeInTheDocument();
  });

  it('displays transaction hash result after proof submission', () => {
    vi.spyOn(useMidnightModule, 'useMidnight').mockReturnValue({
      wallet: { status: 'connected', address: '0x123456', error: null },
      connectWallet: mockConnectWallet,
      disconnectWallet: mockDisconnectWallet,
      circuitState: {
        isExecuting: false,
        proofGenerated: true,
        txHash: '0xabc123def456',
        ledgerValue: 6,
        error: null,
        lastExecutedAt: '12:00:00 PM',
      },
      executeCircuit: mockExecuteCircuit,
      contractAddress: '749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d',
    });

    render(<CircuitCall />);
    expect(screen.getByTestId('tx-result')).toBeInTheDocument();
    expect(screen.getByText('0xabc123def456')).toBeInTheDocument();
  });

  it('triggers executeCircuit when button is clicked', () => {
    vi.spyOn(useMidnightModule, 'useMidnight').mockReturnValue({
      wallet: { status: 'connected', address: '0x123456', error: null },
      connectWallet: mockConnectWallet,
      disconnectWallet: mockDisconnectWallet,
      circuitState: {
        isExecuting: false,
        proofGenerated: false,
        txHash: null,
        ledgerValue: 5,
        error: null,
        lastExecutedAt: null,
      },
      executeCircuit: mockExecuteCircuit,
      contractAddress: '749e975e165abd69dd52f97c31202ad73175993ab046a3b6bb420b3e81d61a7d',
    });

    render(<CircuitCall witnessInput={42} />);
    fireEvent.click(screen.getByTestId('circuit-btn'));
    expect(mockExecuteCircuit).toHaveBeenCalledWith(42);
  });
});
