(function() {
  try {
    var t = localStorage.getItem('lic-theme');
    var dark = t !== null ? t === 'dark' : true;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
