/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08080a',
          900: '#0d0d10',
          850: '#111114',
          800: '#161619',
          700: '#1e1e23',
          600: '#2a2a31',
          500: '#3a3a44'
        },
        bone: {
          50:  '#f5f2ec',
          100: '#ece7dd',
          200: '#c9c3b6',
          300: '#8f8b81',
          400: '#5f5c56'
        },
        accent: {
          DEFAULT: '#8b5cf6',
          soft: '#a78bfa',
          deep: '#6d28d9',
          glow: 'rgba(139, 92, 246, 0.35)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Iowan Old Style', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      letterSpacing: {
        tightest: '-0.04em'
      },
      boxShadow: {
        'inner-hair': 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        'accent-ring': '0 0 0 1px rgba(139, 92, 246, 0.35), 0 0 40px rgba(139, 92, 246, 0.15)'
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    }
  },
  plugins: []
};
