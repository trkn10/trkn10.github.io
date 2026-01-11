// ダーク/ライトモード切り替え
(function () {
  const modeBtn = document.getElementById('toggle-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('color-mode');
  const setIcon = (isDark) => {
    modeBtn.innerHTML = isDark
      ? '<img src="/image/icon/light.png" alt="ライトモード" width="24" height="24">'
      : '<img src="/image/icon/dark.png" alt="ダークモード" width="24" height="24">';
  };
  if ((saved === 'dark') || (!saved && prefersDark)) {
    document.body.classList.add('dark-mode');
  }
  if (modeBtn) {
    modeBtn.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('color-mode', isDark ? 'dark' : 'light');
      setIcon(isDark);
    });
    setIcon(document.body.classList.contains('dark-mode'));
  }
})();

// コードブロックに自動で行番号とコピー用ボタンを付与
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.blog-body pre > code').forEach(function (code) {
    const pre = code.parentElement;
    // すでに行番号が付いている場合はスキップ
    if (!pre.querySelector('.code-lines')) {
      const lines = code.textContent.replace(/\n+$/, '').split('\n');
      const lineCount = lines.length;
      const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('<br>');
      const span = document.createElement('span');
      span.className = 'code-lines';
      span.innerHTML = lineNumbers;
      pre.insertBefore(span, code);
    }
    // コピー用ボタンを追加
    if (!pre.querySelector('.copy-btn')) {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.title = 'コードをコピー';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(code.textContent).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
        });
      });
      pre.appendChild(btn);
    }
  });
});