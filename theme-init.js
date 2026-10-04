// Theme before paint: explicit choice, else the system.
// Its own file (not inline in index.html) so the Content-Security-Policy can
// keep script-src at 'self'. Loaded without defer, in <head>, on purpose.
try {
  var t = localStorage.getItem('ans-doc-theme');
  if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
