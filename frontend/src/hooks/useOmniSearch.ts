import { useState, useEffect, useCallback } from 'react';

export interface Player {
  id: string;
  name: string;
  number: string;
  teamId: string;
}

export interface Game {
  id: string;
  opponent: string;
  date: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Report {
  id: string;
  title: string;
  type: string;
}

export interface Action {
  id: string;
  label: string;
  route: string;
}

export interface OmniSearchResults {
  players: Player[];
  games: Game[];
  teams: Team[];
  reports: Report[];
  actions: Action[];
}

const EMPTY_RESULTS: OmniSearchResults = {
  players: [],
  games: [],
  teams: [],
  reports: [],
  actions: [],
};

/**
 * DESIGN-005-B: OmniSearch hook with 150ms debounce.
 * Currently returns empty results for all sections — data layer
 * wiring is deferred to a future story.
 */
export function useOmniSearch(query: string): OmniSearchResults {
  const [results, setResults] = useState<OmniSearchResults>(EMPTY_RESULTS);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(EMPTY_RESULTS);
      return;
    }
    // TODO (DESIGN-005-C): connect to Dexie / API data sources
    // For now all sections return empty arrays
    setResults(EMPTY_RESULTS);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  return results;
}
