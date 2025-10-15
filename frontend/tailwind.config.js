/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AI Purple Gradient Color Palette
        primary: {
          50: '#faf5ff',   // Very light purple
          100: '#f3e8ff',  // Light purple
          200: '#e9d5ff',  // Soft purple
          300: '#d8b4fe',  // Medium purple
          400: '#c084fc',  // Bright purple
          500: '#8b5cf6',  // Main violet (AI Purple)
          600: '#7c3aed',  // Deep violet
          700: '#6d28d9',  // Darker violet
          800: '#5b21b6',  // Dark violet
          900: '#4c1d95',  // Very dark violet
        },
        secondary: {
          50: '#fafafa',   // Pure white
          100: '#f4f4f5',  // Very light gray
          200: '#e4e4e7',  // Light gray
          300: '#d4d4d8',  // Medium gray
          400: '#a1a1aa',  // Gray
          500: '#71717a',  // Slate gray
          600: '#52525b',  // Dark slate gray
          700: '#3f3f46',  // Darker slate gray
          800: '#27272a',  // Very dark slate gray
          900: '#18181b',  // Almost black
        },
        accent: {
          50: '#fdf2f8',   // Very light pink
          100: '#fce7f3',  // Light pink
          200: '#fbcfe8',  // Soft pink
          300: '#f9a8d4',  // Medium pink
          400: '#f472b6',  // Bright pink
          500: '#ec4899',  // Main pink (AI Accent)
          600: '#db2777',  // Deep pink
          700: '#be185d',  // Darker pink
          800: '#9d174d',  // Dark pink
          900: '#831843',  // Very dark pink
        },
        // Gradient colors for special effects
        gradient: {
          from: '#8b5cf6',  // Start of AI purple gradient
          via: '#7c3aed',   // Middle of AI purple gradient
          to: '#ec4899',    // End of AI purple gradient (pink accent)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #ec4899 100%)',
        'ai-gradient-soft': 'linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)',
        'ai-gradient-strong': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'ai-radial': 'radial-gradient(circle at center, #faf5ff 0%, #8b5cf6 100%)',
        'ai-purple-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'ai-purple-gradient-soft': 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
