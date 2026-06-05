/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Window 1 — Farmer registration (forest green + gold)
        forest: {
          900: '#1a4731',
          700: '#2d6a4f',
          500: '#40916c'
        },
        gold: {
          500: '#d4a017'
        },
        // Window 2 — Distribution & invoicing (olive + amber)
        olive: {
          900: '#2c3e1f',
          700: '#4a6741'
        },
        amber2: {
          500: '#c07c22'
        },
        // Shared canvas
        canvas: '#f4faf6'
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 40, 28, 0.08), 0 1px 2px rgba(16, 40, 28, 0.06)',
        modal: '0 20px 50px rgba(16, 40, 28, 0.30)'
      },
      keyframes: {
        'toast-up': {
          '0%': { opacity: '0', transform: 'translate(-50%, 24px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        }
      },
      animation: {
        'toast-up': 'toast-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'modal-in': 'modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
};
