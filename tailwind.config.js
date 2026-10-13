/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#153E35',
          dark: '#0e2b25',
          light: '#1f5347',
          soft: '#256355',
        },
        ivory: {
          DEFAULT: '#F8F7F2',
          light: '#FCFBF8',
          dark: '#EFECE2',
        },
        sage: {
          DEFAULT: '#DCE8DF',
          light: '#ECF3EE',
          dark: '#BACFC0',
        },
        charcoal: {
          DEFAULT: '#202923',
          light: '#37413B',
          dark: '#121714',
        },
        gold: {
          DEFAULT: '#C7A76C',
          light: '#DBC08C',
          dark: '#A68449',
        },
        mutedText: '#737B75',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(21, 62, 53, 0.06), 0 2px 6px -1px rgba(21, 62, 53, 0.04)',
        'card': '0 10px 30px -4px rgba(21, 62, 53, 0.08), 0 4px 10px -2px rgba(21, 62, 53, 0.03)',
        'elevated': '0 20px 40px -10px rgba(21, 62, 53, 0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
