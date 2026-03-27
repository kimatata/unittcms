const { heroui } = require('@heroui/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Electric Spectrum design token colors
        'surface-container-low': '#eef0fd',
        'surface-container': '#e5e8f6',
        'surface-container-high': '#dee2f1',
        'surface-container-highest': '#d8dcec',
        'surface-container-lowest': '#ffffff',
        'surface-bright': '#f5f6ff',
        'surface-dim': '#cfd4e5',
        'surface-variant': '#d8dcec',
        'on-surface': '#2b2f37',
        'on-surface-variant': '#585b65',
        'on-background': '#2b2f37',
        'outline-variant': '#aaadb8',
        outline: '#737681',
        'on-primary': '#f3f1ff',
        'on-primary-container': '#0b1574',
        'primary-container': '#929bfa',
        'primary-fixed': '#929bfa',
        'primary-fixed-dim': '#858eec',
        'primary-dim': '#3d469f',
        secondary: '#006859',
        'on-secondary': '#c2ffef',
        'secondary-container': '#68fadd',
        'on-secondary-container': '#005d4f',
        'secondary-fixed': '#68fadd',
        tertiary: '#652fe7',
        'on-tertiary': '#f7f0ff',
        'tertiary-container': '#b8a3ff',
        'on-tertiary-container': '#370096',
        error: '#b41340',
        'on-error': '#ffefef',
        'error-container': '#f74b6d',
        'on-error-container': '#510017',
        'error-dim': '#a70138',
        'inverse-primary': '#929bfa',
        'inverse-surface': '#0b0e16',
        'inverse-on-surface': '#9a9ca7',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#4953ac',
              foreground: '#f3f1ff',
              50: '#eef0fd',
              100: '#d8dcec',
              200: '#929bfa',
              300: '#858eec',
              400: '#6370d4',
              500: '#4953ac',
              600: '#3d469f',
              700: '#2c3488',
              800: '#18217d',
              900: '#0b1574',
            },
            secondary: {
              DEFAULT: '#006859',
              foreground: '#c2ffef',
            },
            focus: '#4953ac',
            background: '#f5f6ff',
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: '#929bfa',
              foreground: '#0b1574',
            },
            focus: '#929bfa',
          },
        },
      },
    }),
  ],
};
