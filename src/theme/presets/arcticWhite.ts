import type { ThemeTokens } from '../tokens';

export const label = 'Arctic White (Light Mode)';
export const previewColor = '#FF6B1A';

export const tokens: ThemeTokens & { mode: 'light' | 'dark' } = {
  mode: 'light',
  primary: '#FF6B1A',
  primaryDark: '#D9550D',
  primaryContainer: '#FFE8D9',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#7A2800',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F3F5',
  elevatedCard: '#FFFFFF',
  outline: '#D1D5DB',
  textPrimary: '#0F1115',
  textSecondary: '#6B7280',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
};
