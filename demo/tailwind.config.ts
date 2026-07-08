import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter-loaded)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif-loaded)', 'Source Serif 4', 'Georgia', 'serif'],
        mono: ['var(--font-mono-loaded)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
