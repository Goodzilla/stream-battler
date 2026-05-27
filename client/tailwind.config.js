/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00d8ff',
        'neon-magenta': '#d946ef',
        'neon-yellow': '#ffea00',
        'neon-purple': '#af52de',
        'rarity-common': '#8e8e93',
        'rarity-uncommon': '#34c759',
        'rarity-rare': '#007aff',
        'rarity-epic': '#af52de',
        'rarity-legendary': '#ff9500',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
