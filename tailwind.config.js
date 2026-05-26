/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        background: '#F0EEFF',
        backgroundDark: '#02020F',

        surface: '#EDE5FF',
        surfaceDark: '#1414A8',

        foreground: '#1A0A2E',
        foregroundDark: '#FFFFFF',

        muted: '#7B5EA7',
        mutedDark: '#C0A8FF',

        border: '#E91E8C',
        borderDark: '#FF69B4',

        // Primary: hot pink
        primary: '#191970',
        primaryDark: '#191970',

        success: '#00BFA5',
        successDark: '#00E5C8',

        danger: '#FF1744',
        dangerDark: '#FF5177',

        // Space / disco accents
        gold: '#FFD700',
        neonPink: '#FF69B4',
        electricBlue: '#4444FF',
        neonPurple: '#BF5FFF',
        laserGreen: '#00E676',
        starWhite: '#FFFFFF',
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
      },
      fontSize: {
        display: ['36px', { lineHeight: '42px', letterSpacing: '0.5px' }],
        title: ['24px', { lineHeight: '30px', letterSpacing: '0.1px' }],
        headline: ['18px', { lineHeight: '24px', letterSpacing: '0.1px' }],
        body: ['16px', { lineHeight: '22px' }],
        caption: ['15px', { lineHeight: '20px' }],
      },
      fontFamily: {
        nunito: ['Nunito_400Regular'],
        'nunito-medium': ['Nunito_500Medium'],
        'nunito-semibold': ['Nunito_600SemiBold'],
        'nunito-bold': ['Nunito_700Bold'],
        'nunito-extrabold': ['Nunito_800ExtraBold'],
        righteous: ['Righteous_400Regular'],
        vt323: ['VT323_400Regular'],
      },
    },
  },
  plugins: [],
};

