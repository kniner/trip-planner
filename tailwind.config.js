/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        must: '#16a34a',
        nice: '#2563eb',
        avoid: '#dc2626',
      },
    },
  },
  plugins: [],
};
