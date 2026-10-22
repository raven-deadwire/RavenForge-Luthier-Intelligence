// Tailwind v3 build for configurator.html / configurator-preview.html
// (replaces the cdn.tailwindcss.com runtime). Rebuild with: tools/build_tailwind_css.sh
module.exports = {
  content: ['./configurator.html', './configurator-preview.html', './assets/configurator-*.js'],
  theme: { extend: {} },
  plugins: [],
};
