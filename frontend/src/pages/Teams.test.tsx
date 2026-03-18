import { render, screen } from '@testing-library/react';
import Teams from './Teams';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock Dexie
vi.mock('../db', () => ({
  db: {
    open: vi.fn().mockResolvedValue(null),
    seasons: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    teams: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      toArray: vi.fn().mockResolvedValue([]),
    },
    players: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    teamPlayers: {
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('Teams Component', () => {
  it('renders Teams page', () => {
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    expect(screen.getByText(/Team Management/i)).toBeInTheDocument();
  });
});
