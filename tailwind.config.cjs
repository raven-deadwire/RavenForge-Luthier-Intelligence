// Tailwind v3 build for the homepage (replaces the cdn.tailwindcss.com runtime).
// Rebuild with: tools/build_tailwind_css.sh
module.exports = {
  content: ['./index.html', './assets/**/*.js', '!./assets/vendor/**'],
  theme: { extend: {} },
  plugins: [],
};
