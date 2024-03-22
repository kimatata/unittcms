import { nextui } from "@nextui-org/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#030712",
              foreground: "#FFFFFF",
            },
            focus: "#030712",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#d1d5db",
              foreground: "#000000",
            },
            focus: "#d1d5db",
          },
        },
      },
    }),
  ],
};
