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
        // Icy Gradient Color Palette
        primary: {
          50: '#f0f9ff',   // Very light icy blue
          100: '#e0f2fe',  // Light icy blue
          200: '#bae6fd',  // Soft icy blue
          300: '#7dd3fc',  // Medium icy blue
          400: '#38bdf8',  // Bright icy blue
          500: '#0ea5e9',  // Main icy blue
          600: '#0284c7',  // Deep icy blue
          700: '#0369a1',  // Darker icy blue
          800: '#075985',  // Dark icy blue
          900: '#0c4a6e',  // Very dark icy blue
        },
        secondary: {
          50: '#f8fafc',   // Pure white with hint of blue
          100: '#f1f5f9',  // Very light gray-blue
          200: '#e2e8f0',  // Light gray-blue
          300: '#cbd5e1',  // Medium gray-blue
          400: '#94a3b8',  // Gray-blue
          500: '#64748b',  // Slate blue
          600: '#475569',  // Dark slate blue
          700: '#334155',  // Darker slate blue
          800: '#1e293b',  // Very dark slate blue
          900: '#0f172a',  // Almost black with blue tint
        },
        accent: {
          50: '#f0fdfa',   // Very light mint
          100: '#ccfbf1',  // Light mint
          200: '#99f6e4',  // Soft mint
          300: '#5eead4',  // Medium mint
          400: '#2dd4bf',  // Bright mint
          500: '#14b8a6',  // Main mint
          600: '#0d9488',  // Deep mint
          700: '#0f766e',  // Darker mint
          800: '#115e59',  // Dark mint
          900: '#134e4a',  // Very dark mint
        },
        // Gradient colors for special effects
        gradient: {
          from: '#f0f9ff',  // Start of icy gradient
          via: '#e0f2fe',   // Middle of icy gradient
          to: '#0ea5e9',    // End of icy gradient
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'icy-gradient': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #0ea5e9 100%)',
        'icy-gradient-soft': 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)',
        'icy-gradient-strong': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        'icy-radial': 'radial-gradient(circle at center, #f0f9ff 0%, #0ea5e9 100%)',
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
  plugins: [],
}
