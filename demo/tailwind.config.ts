import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Match the FastAPI/PDF palette for visual consistency
        accent: {
          DEFAULT: '#8b7226',  // gold
          blue: '#5e78c5',
          green: '#4e9565',
          red: '#91534d',
          amber: '#a28856',
        },
        surface: {
          DEFAULT: '#f6f6f5',
          card: '#ffffff',
          muted: '#eceae5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
