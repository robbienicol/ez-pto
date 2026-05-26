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
    background: '#F0EEFF',
    surface: '#EDE5FF',
    foreground: '#1A0A2E',
    muted: '#7B5EA7',
    border: '#E91E8C',
    primary: '#E91E8C',
    success: '#00BFA5',
    danger: '#FF1744',
  },
};

export const darkTokens: ThemeTokens = {
  colors: {
    background: '#02020F',
    surface: '#1414A8',
    foreground: '#FFFFFF',
    muted: '#C0A8FF',
    border: '#FF69B4',
    primary: '#FF4DB3',
    success: '#00E5C8',
    danger: '#FF5177',
  },
};
