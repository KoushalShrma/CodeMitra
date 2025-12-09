/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2d3748',
          850: '#1a202c',
        }
      }
    },
  },
  safelist: [
    // Colors used dynamically in components
    'bg-blue-500/20', 'bg-orange-500/20', 'bg-yellow-500/20', 'bg-purple-500/20',
    'bg-green-500/20', 'bg-red-500/20',
    'text-blue-400', 'text-orange-400', 'text-yellow-400', 'text-purple-400',
    'text-green-400', 'text-red-400',
    'border-blue-500/30', 'border-orange-500/30', 'border-yellow-500/30',
    'border-purple-500/30', 'border-green-500/30', 'border-red-500/30',
    'border-blue-500', 'border-yellow-500', 'border-green-500', 'border-red-500',
  ],
  plugins: [],
}
