/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#1E281C',
          'forest-deep': '#121911',
          'forest-surface': '#263424',
          ivory: '#F7F3EE',
          'ivory-warm': '#EFE8DE',
          cream: '#E5DAD6',
          sage: '#A5B2A0',
          'sage-light': '#C8D2C4',
          champagne: '#CBB57B',
          'champagne-light': '#E5D7B3',
          'champagne-dark': '#9A8449',
        },
        game: {
          amber: '#F59E0B',
          emerald: '#10B981',
          purple: '#8B5CF6',
          rose: '#F43F5E',
          sky: '#0EA5E9',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        game: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2.5s infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}

