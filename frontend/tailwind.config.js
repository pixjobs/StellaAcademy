// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx,md,mdx}',
    './src/components/**/*.{ts,tsx,md,mdx}',
    './src/**/*.{ts,tsx,md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: 'hsl(var(--custom-mint))',
        sky: 'hsl(var(--custom-sky))',
        gold: 'hsl(var(--custom-gold))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'hsl(var(--foreground))',
            'h1,h2,h3,h4,h5,h6': { color: 'hsl(var(--foreground))' },
            a: { color: 'hsl(var(--gold))' },
            strong: { color: 'hsl(var(--foreground))' },
            code: { color: 'hsl(var(--foreground))' },
            th: { color: 'hsl(var(--foreground))' },
            'thead th': { color: 'hsl(var(--foreground))' },
          },
        },
        invert: {
          css: {
            color: 'hsl(var(--foreground))',
            'h1,h2,h3,h4,h5,h6': { color: 'hsl(var(--foreground))' },
            a: { color: 'hsl(var(--gold))' },
            strong: { color: 'hsl(var(--foreground))' },
            code: { color: 'hsl(var(--foreground))' },
            th: { color: 'hsl(var(--foreground))' },
            'thead th': { color: 'hsl(var(--foreground))' },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
