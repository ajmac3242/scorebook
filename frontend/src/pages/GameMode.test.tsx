import { render, screen } from '@testing-library/react';
import GameMode from './GameMode';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';

// Mock Dexie
vi.mock('../db', () => ({
  db: {
    players: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    stats: {
      orderBy: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    },
    open: vi.fn().mockResolvedValue(true),
  },
}));

const theme = createTheme();

describe('GameMode Component', () => {
  it('renders GameMode page', async () => {
    render(
      <ThemeProvider theme={theme}>
        <GameMode />
      </ThemeProvider>
    );

    expect(screen.getByText(/Live Game Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Lineup/i)).toBeInTheDocument();
  });
});
