import { Fira_Code as FontMono, Manrope } from 'next/font/google';

export const fontSans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
});
