/** @type {import('tailwindcss').Config} */

// Every colour resolves to a CSS variable defined in src/renderer/src/index.css,
// so one set of class names serves both the light (paper) and dark (ink) themes.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: token('paper'),
          deep: token('paper-deep'),
          card: token('paper-card')
        },
        rule: token('rule'),
        line: token('line'),
        fg: {
          DEFAULT: token('fg'),
          muted: token('fg-muted'),
          faint: token('fg-faint')
        },
        accent: {
          DEFAULT: token('accent'),
          fg: token('accent-fg'),
          text: token('accent-text')
        },
        danger: token('danger')
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Iowan Old Style', 'Georgia', 'serif'],
        display: ['Instrument Serif', 'Iowan Old Style', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        clip: '0 2px 0 rgb(var(--line))',
        'accent-ring': '0 0 0 1px rgb(var(--accent) / 0.35), 0 0 32px rgb(var(--accent) / 0.18)'
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    }
  },
  plugins: []
};
