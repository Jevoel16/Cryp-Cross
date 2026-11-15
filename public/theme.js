// Applies a saved Light or Dark choice before render; a file (not inline) so CSP stays script-src 'self'.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch (e) {
    theme = null;
  }
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f3f6ef' : '#070b12');
})();
