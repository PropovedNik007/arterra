import flowbitePlugin from 'flowbite/plugin'

// import type { Config } from 'tailwindcss';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // flowbite-svelte
        primary: {
          50: '#FFFFFF',
          100: '#FFF1EE',
          200: '#FFE4DE',
          300: '#FFD5CC',
          400: '#FFBCAD',
          500: '#FE795D',
          600: '#EF562F',
          700: '#FFFFFF',
          800: '#CC4522',
          900: '#FFFFFF'
        },
        gray: {
          50: '#263238',
          100: '#263238',
          200: '#F1F1F1',
          300: '#E8E8E8',
          400: '#D9D9D9',
          500: '#B8B8B8',
          600: '#8F8F8F',
          700: '#607D8B',
          800: '#4F4F4F',
          900: '#FFFFFF'
        },
      }
    },
  },
  plugins: [flowbitePlugin],
}

