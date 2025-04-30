/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '130%' }],
        'display-md': ['2.5rem', { lineHeight: '130%' }],
        'display-sm': ['2rem', { lineHeight: '130%' }],
        'headline-lg': ['1.75rem', { lineHeight: '140%' }],
        'headline-md': ['1.5rem', { lineHeight: '140%' }],
        'headline-sm': ['1.25rem', { lineHeight: '140%' }],
        'body-lg': ['1.125rem', { lineHeight: '150%' }],
        'body-md': ['1rem', { lineHeight: '150%' }],
        'body-sm': ['0.875rem', { lineHeight: '150%' }],
        'caption-lg': ['0.875rem', { lineHeight: '140%' }],
        'caption-md': ['0.75rem', { lineHeight: '140%' }],
        'caption-sm': ['0.6875rem', { lineHeight: '140%' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        whatsapp: '#25D366',
        facebook: '#1877F2',
        twitter: '#1DA1F2',
        linkedin: '#0A66C2',
        telegram: '#0088cc',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        '4.5': '1.125rem',
        '7': '1.75rem',
        '12': '3rem',
        '16': '4rem',
        '30': '7.5rem',
        '32': '8rem',
        '95vh': '95vh'
      },
      width: {
        '95vw': '95vw',
        '400': '400px',
        '500': '500px',
      },
      height: {
        '12': '3rem',
        '30': '7.5rem',
        '37.5': '9.375rem',
      },
      zIndex: {
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
      },
      transform: {
        'scale-95': 'scale(0.95)',
        'scale-105': 'scale(1.05)',
        'scale-110': 'scale(1.10)',
      },
      transitionDuration: {
        '300': '300ms',
        '200': '200ms',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "spin": {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin": "spin 1s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}