export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(24px, -18px) scale(1.06)' },
          '66%':      { transform: 'translate(-14px, 14px) scale(0.96)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'blob':         'blob 9s ease-in-out infinite',
        'blob-slow':    'blob 13s ease-in-out infinite',
        'blob-slower':  'blob 17s ease-in-out infinite',
        'fade-in-up':   'fadeInUp 0.5s ease-out both',
        'fade-in':      'fadeIn 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
