/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        odoo: {
          primary: '#FF5722',     // Brand orange accent
          dark: '#0B0F17',        // Deep dark background
          card: '#161F30',        // Card charcoal containers
          sidebar: '#090D14',     // Sidebar deep black
          accent: '#F97316',      // Hover state lighter orange
          success: '#10B981',     // Available Green
          warning: '#F59E0B',     // Reserved Orange/Yellow
          danger: '#EF4444',      // Occupied Red
          activeBtn: '#1F293D',   // Keypad slate
          textMuted: '#94A3B8'    // Slate-400 equivalent for details
        }
      }
    },
  },
  plugins: [],
}
