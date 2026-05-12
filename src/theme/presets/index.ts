/**
 * CourtSight Theme Presets — Barrel Export
 *
 * DESIGN-011-A: All preset token files are exported here.
 * Import presets from this file, not from individual preset files directly.
 *
 * Usage in ThemeContext (DESIGN-011-B):
 *   import { allPresets } from './presets';
 */

import * as electricOrange from './electricOrange';
import * as midnightNavy from './midnightNavy';
import * as championshipGold from './championshipGold';
import * as emeraldCourt from './emeraldCourt';
import * as electricViolet from './electricViolet';
import * as crimsonBlaze from './crimsonBlaze';
import * as arcticWhite from './arcticWhite';
import * as stealth from './stealth';
import type { ThemeTokens } from '../tokens';

export interface ThemePreset {
  id: string;
  label: string;
  previewColor: string;
  tokens: ThemeTokens;
}

export const allPresets: ThemePreset[] = [
  { id: 'electricOrange', label: electricOrange.label, previewColor: electricOrange.previewColor, tokens: electricOrange.tokens },
  { id: 'midnightNavy', label: midnightNavy.label, previewColor: midnightNavy.previewColor, tokens: midnightNavy.tokens },
  { id: 'championshipGold', label: championshipGold.label, previewColor: championshipGold.previewColor, tokens: championshipGold.tokens },
  { id: 'emeraldCourt', label: emeraldCourt.label, previewColor: emeraldCourt.previewColor, tokens: emeraldCourt.tokens },
  { id: 'electricViolet', label: electricViolet.label, previewColor: electricViolet.previewColor, tokens: electricViolet.tokens },
  { id: 'crimsonBlaze', label: crimsonBlaze.label, previewColor: crimsonBlaze.previewColor, tokens: crimsonBlaze.tokens },
  { id: 'arcticWhite', label: arcticWhite.label, previewColor: arcticWhite.previewColor, tokens: arcticWhite.tokens },
  { id: 'stealth', label: stealth.label, previewColor: stealth.previewColor, tokens: stealth.tokens },
];

export const defaultPresetId = 'electricOrange';
