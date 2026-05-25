import React from 'react';
import { render, screen } from '@testing-library/react';
import { SparkPlugTable } from '../../pages/GameMode/SparkPlugTable';

jest.mock('../../components/SharedUI', () => ({
  MoleskineCard: ({ children }: any) => <div>{children}</div>,
}));

const mockEntry = (playerId: string, hustle: number, momentum: number, index: number) => ({
  playerId,
  hustleStats: hustle,
  momentumScore: momentum,
  compositeIndex: index,
});

const jerseyMap = new Map([['p1', '23'], ['p2', '7'], ['p3', '11']]);
const playerNamesMap = new Map([['p1', 'LeBron James'], ['p2', 'Kevin Durant'], ['p3', 'Steph Curry']]);

describe('SparkPlugTable', () => {
  it('shows empty state message when sparkPlugIndex is empty', () => {
    render(
      <SparkPlugTable
        sparkPlugIndex={[]}
        jerseyMap={jerseyMap}
        playerNamesMap={playerNamesMap}
      />
    );
    expect(screen.getByText(/collecting momentum data/i)).toBeInTheDocument();
  });

  it('renders table headers when data is present', () => {
    const entries = [mockEntry('p1', 8, 7, 15)];
    render(
      <SparkPlugTable
        sparkPlugIndex={entries}
        jerseyMap={jerseyMap}
        playerNamesMap={playerNamesMap}
      />
    );
    expect(screen.getByText('PLAYER')).toBeInTheDocument();
    expect(screen.getByText('HUSTLE')).toBeInTheDocument();
    expect(screen.getByText('INDEX')).toBeInTheDocument();
  });

  it('renders player jersey number', () => {
    const entries = [mockEntry('p1', 8, 7, 15)];
    render(
      <SparkPlugTable
        sparkPlugIndex={entries}
        jerseyMap={jerseyMap}
        playerNamesMap={playerNamesMap}
      />
    );
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('renders composite index chip', () => {
    const entries = [mockEntry('p1', 8, 7, 15)];
    render(
      <SparkPlugTable
        sparkPlugIndex={entries}
        jerseyMap={jerseyMap}
        playerNamesMap={playerNamesMap}
      />
    );
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders up to top 3 entries only', () => {
    const entries = [
      mockEntry('p1', 8, 7, 15),
      mockEntry('p2', 6, 5, 11),
      mockEntry('p3', 5, 4, 9),
      mockEntry('p4', 3, 2, 5),
    ];
    const extendedJerseyMap = new Map([...jerseyMap, ['p4', '99']]);
    const extendedNamesMap = new Map([...playerNamesMap, ['p4', 'Extra Player']]);
    render(
      <SparkPlugTable
        sparkPlugIndex={entries}
        jerseyMap={extendedJerseyMap}
        playerNamesMap={extendedNamesMap}
      />
    );
    expect(screen.queryByText('99')).not.toBeInTheDocument();
  });
});
