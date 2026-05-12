import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionControls } from './ActionControls';
import React from 'react';

describe('ActionControls', () => {
  const props = {
    isReadOnly: false,
    onUndo: vi.fn(),
    onQuickSub: vi.fn(),
    onFtWorkflow: vi.fn(),
    onAuditSubs: vi.fn(),
    onTimeout: vi.fn(),
    onNextPeriod: vi.fn(),
    onTogglePossession: vi.fn(),
    possessionState: null,
    recentStatsLength: 5,
    onEndGame: vi.fn(),
    isGameCompleted: false,
    isEnding: false,
  };

  it('calls onNextPeriod when Period button is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Advance to Next Period' }));
    expect(props.onNextPeriod).toHaveBeenCalled();
  });

  it('calls onTogglePossession when Poss button is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change possession to Our Team' }));
    expect(props.onTogglePossession).toHaveBeenCalled();
  });

  it('calls onQuickSub when Sub button is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByLabelText('manage lineup substitutions'));
    expect(props.onQuickSub).toHaveBeenCalled();
  });

  it('calls onAuditSubs when Audit icon is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByLabelText('audit substitutions history'));
    expect(props.onAuditSubs).toHaveBeenCalled();
  });

  it('calls onTimeout when Timeout button is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByLabelText('log team timeout'));
    expect(props.onTimeout).toHaveBeenCalled();
  });

  it('calls onFtWorkflow when FT button is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByLabelText('record free throws'));
    expect(props.onFtWorkflow).toHaveBeenCalled();
  });

  it('calls onUndo when Undo button is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByLabelText('undo last action'));
    expect(props.onUndo).toHaveBeenCalled();
  });

  it('calls onEndGame when End Game button is clicked', () => {
    render(<ActionControls {...props} />);
    fireEvent.click(screen.getByLabelText('End and Save Game'));
    expect(props.onEndGame).toHaveBeenCalled();
  });

  it('disables buttons when isReadOnly is true', () => {
    render(<ActionControls {...props} isReadOnly={true} />);
    expect(screen.getByRole('button', { name: 'Advance to Next Period' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Change possession to Our Team' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'manage lineup substitutions' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'log team timeout' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'record free throws' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'undo last action' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'End and Save Game' })).toBeNull();
  });

  it('disables undo when recentStatsLength is 0', () => {
    render(<ActionControls {...props} recentStatsLength={0} />);
    expect(screen.getByLabelText('undo last action (no actions to undo)')).toBeDisabled();
  });
});
