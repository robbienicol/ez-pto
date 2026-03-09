/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        backgroundDark: '#0B1220',

        surface: '#FFFFFF',
        surfaceDark: '#0F1B2D',

        foreground: '#0F172A',
        foregroundDark: '#E5E7EB',

        muted: '#64748B',
        mutedDark: '#94A3B8',

        border: '#E2E8F0',
        borderDark: '#24324A',

        primary: '#2563EB',
        primaryDark: '#60A5FA',

        success: '#16A34A',
        successDark: '#4ADE80',

        danger: '#DC2626',
        dangerDark: '#F87171',
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
      },
      fontSize: {
        display: ['32px', { lineHeight: '38px', letterSpacing: '-0.5px' }],
        title: ['24px', { lineHeight: '30px', letterSpacing: '-0.25px' }],
        headline: ['18px', { lineHeight: '24px' }],
        body: ['16px', { lineHeight: '22px' }],
        caption: ['13px', { lineHeight: '18px' }],
      },
      fontFamily: {
        nunito: ['Nunito_400Regular'],
        'nunito-medium': ['Nunito_500Medium'],
        'nunito-semibold': ['Nunito_600SemiBold'],
        'nunito-bold': ['Nunito_700Bold'],
        'nunito-extrabold': ['Nunito_800ExtraBold'],
      },
      colors: {
        sun: '#F59E0B',
        ocean: '#0EA5E9',
        coral: '#F97316',
        mint: '#10B981',
      },
    },
  },
  plugins: [],
};

