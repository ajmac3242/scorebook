import React from 'react';
import { render, screen } from '@testing-library/react';
import MatchupAnalyticsCard from '../../pages/GameMode/MatchupAnalyticsCard';

const defaultStats = [
  { label: 'Points', homeValue: 45, awayValue: 38, highlight: 'home' as const },
  { label: 'Rebounds', homeValue: 20, awayValue: 22, highlight: 'away' as const },
  { label: 'Assists', homeValue: 10, awayValue: 10, highlight: 'none' as const },
];

const defaultProps = {
  homeTeamName: 'Lakers',
  awayTeamName: 'Celtics',
  stats: defaultStats,
};

describe('MatchupAnalyticsCard', () => {
  it('renders home and away team names as chips', () => {
    render(<MatchupAnalyticsCard {...defaultProps} />);
    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('Celtics')).toBeInTheDocument();
  });

  it('renders default title when not provided', () => {
    render(<MatchupAnalyticsCard {...defaultProps} />);
    expect(screen.getByText('Matchup Analytics')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<MatchupAnalyticsCard {...defaultProps} title="Q2 Breakdown" />);
    expect(screen.getByText('Q2 Breakdown')).toBeInTheDocument();
  });

  it('renders all stat labels', () => {
    render(<MatchupAnalyticsCard {...defaultProps} />);
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('Rebounds')).toBeInTheDocument();
    expect(screen.getByText('Assists')).toBeInTheDocument();
  });

  it('renders home and away stat values', () => {
    render(<MatchupAnalyticsCard {...defaultProps} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('renders vs separator text', () => {
    render(<MatchupAnalyticsCard {...defaultProps} />);
    expect(screen.getByText('vs')).toBeInTheDocument();
  });

  it('renders empty stats without crashing', () => {
    render(<MatchupAnalyticsCard {...defaultProps} stats={[]} />);
    expect(screen.getByText('Matchup Analytics')).toBeInTheDocument();
  });
});
