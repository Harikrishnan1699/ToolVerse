/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe7ff',
          200: '#bfd2ff',
          300: '#94b3ff',
          400: '#6489ff',
          500: '#3a5cff',
          600: '#2438f5',
          700: '#1c2ad8',
          800: '#1c25ae',
          900: '#1d2789',
          950: '#11164d',
        },
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(58, 92, 255, 0.45)',
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        gradient: {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
