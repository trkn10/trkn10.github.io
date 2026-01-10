// ダーク/ライトモード切り替え
(function() {
  const modeBtn = document.getElementById('toggle-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('color-mode');
  const setIcon = (isDark) => {
    modeBtn.innerHTML = isDark
      ? '<img src="image/icon/light.png" alt="ライトモード" width="24" height="24">'
      : '<img src="image/icon/dark.png" alt="ダークモード" width="24" height="24">';
  };
  if ((saved === 'dark') || (!saved && prefersDark)) {
    document.body.classList.add('dark-mode');
  }
  if (modeBtn) {
    modeBtn.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('color-mode', isDark ? 'dark' : 'light');
      setIcon(isDark);
    });
    setIcon(document.body.classList.contains('dark-mode'));
  }
})();
