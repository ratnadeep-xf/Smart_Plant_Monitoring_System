/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'plant-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 4s cubic-bezier(0.3, 0, 0.7, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(74, 222, 128, 0.2), 0 0 10px rgba(74, 222, 128, 0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(74, 222, 128, 0.3), 0 0 20px rgba(74, 222, 128, 0.2)' }
        },
        scan: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '50.1%': { top: '0%' },
          '100%': { top: '100%' }
        }
      },
      backgroundImage: {
        'tech-pattern': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232d3748' fill-opacity='0.3' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='17' cy='3' r='1'/%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3Ccircle cx='3' cy='17' r='1'/%3E%3Ccircle cx='17' cy='17' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'neon-blue': '0 0 5px theme("colors.blue.400"), 0 0 20px theme("colors.blue.600")',
        'neon-green': '0 0 5px theme("colors.green.400"), 0 0 20px theme("colors.green.600")',
        'neon-red': '0 0 5px theme("colors.red.400"), 0 0 20px theme("colors.red.600")',
        'inner-glow': 'inset 0 0 20px 5px rgba(74, 222, 128, 0.1)',
      },
    },
  },
  plugins: [],
}