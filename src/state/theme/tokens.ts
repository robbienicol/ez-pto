export type ThemeName = 'light' | 'dark';

export interface ThemeTokens {
  colors: {
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    border: string;
    primary: string;
    success: string;
    danger: string;
  };
}

export const lightTokens: ThemeTokens = {
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    foreground: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    success: '#16A34A',
    danger: '#DC2626',
  },
};

export const darkTokens: ThemeTokens = {
  colors: {
    background: '#0B1220',
    surface: '#0F1B2D',
    foreground: '#E5E7EB',
    muted: '#94A3B8',
    border: '#24324A',
    primary: '#60A5FA',
    success: '#4ADE80',
    danger: '#F87171',
  },
};
