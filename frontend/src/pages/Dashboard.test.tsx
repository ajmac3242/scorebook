import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { describe, it, expect } from 'vitest';

describe('Dashboard Component', () => {
  it('renders Dashboard page', () => {
    render(<Dashboard />);

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome Coach!/i)).toBeInTheDocument();
  });
});
