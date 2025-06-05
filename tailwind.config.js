module.exports = {
    content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'premium-black': '#0d0d0d',
                'soft-black':    '#111418',
                'platinum-gray': '#e5e4e2',
                'slate-gray':    '#5e6367',
                'accent-gold':   '#d4af37',   // görünür “premium” altın
                'accent-gold-dark': '#a78d2b',// basılı durum rengi
            },
        },
    },
    plugins: [],
};
