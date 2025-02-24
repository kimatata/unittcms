const { heroui } = require('@heroui/theme');
import { heroui } from '@heroui/theme';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/components/(toast|spinner).js',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#030712',
              foreground: '#FFFFFF',
            },
            focus: '#030712',
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: '#1F883D',
              foreground: '#FFFFFF',
            },
            focus: '#1F883D',
          },
        },
      },
    }),
    heroui(),
  ],
};
