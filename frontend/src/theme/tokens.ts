/**
 * CourtSight Design Tokens
 *
 * DESIGN-001-A: Token Interface & Electric Orange Values
 *
 * This file is the single source of truth for all color decisions in CourtSight.
 * All components must consume colors via the MUI theme (built from these tokens)
 * and NEVER use hardcoded hex values directly.
 *
 * To create a new theme, implement the ThemeTokens interface and pass the object
 * to buildCourtSightTheme() in buildTheme.ts.
 */

export interface ThemeTokens {
  /** Brand accent — primary interactive color (buttons, active nav, live badges) */
  primary: string;
  /** Darker shade of primary — used for hover and pressed states */
  primaryDark: string;
  /** Subtle tinted background — used for active nav item background, selected chips */
  primaryContainer: string;
  /** Text/icon color on top of primary — ensures contrast on filled primary surfaces */
  onPrimary: string;
  /** Text/icon color on top of primaryContainer */
  onPrimaryContainer: string;
  /** Page/app background — the darkest surface */
  background: string;
  /** Card, drawer, and dialog background */
  surface: string;
  /** Slightly elevated surface — table headers, input backgrounds, segmented controls */
  surfaceVariant: string;
  /** Elevated card background — used for KPI cards and floating panels */
  elevatedCard: string;
  /** Divider and border color */
  outline: string;
  /** Primary readable text */
  textPrimary: string;
  /** Muted labels, subtitles, and secondary data */
  textSecondary: string;
  /** Positive stat signals — on-court indicator, assist streaks, lead indicators */
  success: string;
  /** Caution signals — foul trouble (1-3 fouls), pace warnings */
  warning: string;
  /** Critical signals — foul danger (4+ fouls), opponent runs, sync errors */
  error: string;
  /** Neutral informational — secondary comparative data, info chips */
  info: string;
  /** Theme mode override — 'light' or 'dark' */
  mode?: 'light' | 'dark';
}

/**
 * Electric Orange — Default CourtSight theme
 *
 * Court-side heat with deep graphite surfaces.
 * Orange is reserved for high-signal actions only — CTAs, active states,
 * live badges, and urgent stat alerts. Never use orange on every chart series.
 */
export const electricOrangeTokens: ThemeTokens = {
  primary: '#FF6B1A',
  primaryDark: '#D9550D',
  primaryContainer: '#3A2418',
  onPrimary: '#1A0F09',
  onPrimaryContainer: '#FFD9C7',
  background: '#0F1115',
  surface: '#151922',
  surfaceVariant: '#1C2230',
  elevatedCard: '#222A3A',
  outline: '#384256',
  textPrimary: '#F3F6FA',
  textSecondary: '#AAB4C5',
  success: '#35C759',
  warning: '#FFB020',
  error: '#FF5D73',
  info: '#5AA9FF',
};
