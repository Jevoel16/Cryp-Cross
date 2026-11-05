// Runs before the app renders so the saved (or system) theme applies without a flash.
// Kept as a file, not an inline script, so the CSP can stay script-src 'self'.
(function () {
  var theme;
  try {
    theme = localStorage.getItem('theme');
  } catch (e) {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
