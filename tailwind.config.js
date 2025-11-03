/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'accent-magenta': 'var(--accent-magenta)',
        'accent-lime': 'var(--accent-lime)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-orange': 'var(--accent-orange)',
        charcoal: 'var(--charcoal)',
        gray: 'var(--gray)',
      },
    },
  },
  plugins: [],
};
