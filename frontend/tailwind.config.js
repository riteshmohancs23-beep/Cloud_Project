import { createRequire } from 'module'
const _require = createRequire(import.meta.url)

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        surface:    'hsl(var(--surface))',
        'surface-2':'hsl(var(--surface-2))',
        primary:    'hsl(var(--primary))',
        secondary:  'hsl(var(--secondary))',
        muted:      'hsl(var(--muted))',
        border:     'hsl(var(--border))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px hsl(var(--primary) / 0.2)' },
          '50%':      { boxShadow: '0 0 32px hsl(var(--primary) / 0.5)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        float:        'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'fade-up':    'fade-up 0.5s ease forwards',
        'fade-in':    'fade-in 0.4s ease forwards',
        'spin-slow':  'spin-slow 8s linear infinite',
      },
    },
  },
  plugins: [
    (() => { try { return _require('tailwindcss-animate') } catch { return () => {} } })(),
  ],
}
