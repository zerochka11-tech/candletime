/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class', // Включаем dark mode через класс
  theme: {
    extend: {
      animation: {
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'float': 'float 15s ease-in-out infinite',
        'float-slow': 'float-slow 20s ease-in-out infinite',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.6' },
          '33%': { transform: 'translateY(-10px) translateX(5px)', opacity: '0.8' },
          '66%': { transform: 'translateY(-5px) translateX(-5px)', opacity: '0.7' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.5' },
          '33%': { transform: 'translateY(-15px) translateX(8px)', opacity: '0.7' },
          '66%': { transform: 'translateY(-8px) translateX(-8px)', opacity: '0.6' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
