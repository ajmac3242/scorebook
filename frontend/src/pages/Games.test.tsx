import { render, screen } from '@testing-library/react';
import Games from './Games';
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
    games: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('Games Component', () => {
  it('renders Games page', () => {
    render(
      <BrowserRouter>
        <Games />
      </BrowserRouter>
    );

    expect(screen.getByText(/Games/i)).toBeInTheDocument();
  });
});
