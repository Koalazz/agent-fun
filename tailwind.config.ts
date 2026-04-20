import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#081420',
          panel: '#0d1c2c',
          raised: '#132a3e',
          hover: '#1a3650',
        },
        line: {
          dim: '#1e3a55',
          DEFAULT: '#2a4c6b',
          bright: '#3d6991',
        },
        accent: {
          amber: '#f5a623',
          amberBright: '#ffcc33',
          blue: '#4aa3df',
          green: '#3fb950',
          red: '#f85149',
          violet: '#a58aff',
        },
        text: {
          dim: '#6b8aa8',
          DEFAULT: '#c9d8e7',
          bright: '#ffffff',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
        display: ['"Rajdhani"', '"Orbitron"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: 'inset 0 0 0 1px rgba(42, 76, 107, 0.6)',
        panelActive: 'inset 0 0 0 1px rgba(245, 166, 35, 0.55)',
      },
    },
  },
  plugins: [],
};

export default config;
