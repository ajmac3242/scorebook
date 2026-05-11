import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditClockDialog } from './EditClockDialog';
import React from 'react';

describe('EditClockDialog', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();

  it('renders with initial values', () => {
    render(
      <EditClockDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        initialMinutes={10}
        initialSeconds={30}
      />
    );

    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('30')).toBeDefined();
  });

  it('can increment/decrement minutes', () => {
    render(
      <EditClockDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        initialMinutes={10}
        initialSeconds={30}
      />
    );

    const incMin = screen.getByLabelText('Increase minutes');
    const decMin = screen.getByLabelText('Decrease minutes');

    fireEvent.click(incMin);
    expect(screen.getByText('11')).toBeDefined();

    fireEvent.click(decMin);
    fireEvent.click(decMin);
    expect(screen.getByText('9')).toBeDefined();
  });

  it('can increment/decrement seconds with wrap around', () => {
    render(
      <EditClockDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        initialMinutes={10}
        initialSeconds={59}
      />
    );

    const incSec = screen.getByLabelText('Increase seconds');
    fireEvent.click(incSec);
    expect(screen.getByText('00')).toBeDefined();

    const decSec = screen.getByLabelText('Decrease seconds');
    fireEvent.click(decSec);
    expect(screen.getByText('59')).toBeDefined();
  });

  it('can use preset buttons', () => {
    render(
      <EditClockDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        initialMinutes={10}
        initialSeconds={30}
      />
    );

    fireEvent.click(screen.getByText('12:00'));
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('00')).toBeDefined();
  });

  it('calls onSave with current values', () => {
    render(
      <EditClockDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        initialMinutes={10}
        initialSeconds={30}
      />
    );

    fireEvent.click(screen.getByText('Save Clock'));
    expect(onSave).toHaveBeenCalledWith(10, 30);
  });

  it('calls onClose when cancel is clicked', () => {
    render(
      <EditClockDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        initialMinutes={10}
        initialSeconds={30}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
