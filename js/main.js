// ブログ記事リスト（ここに記事を追加するだけでOK）
const blogArticles = [
  { url: '/blogs/20260111/index.html' }
  // 例: { url: '/blogs/20260112/index.html' }, ...
];

// ブログ記事一覧を自動生成
document.addEventListener('DOMContentLoaded', function () {
  const list = document.getElementById('blog-list');
  if (!list) return;
  blogArticles.forEach((article) => {

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h1></h1>
      <p></p>
      <time class="blog-date text-gray"></time>
      <div class="work-tags"></div>
      <a href="${article.url}">続きを読む</a>
    `;
    list.appendChild(card);

    fetch(article.url)
      .then(res => res.text())
      .then(html => {
        const div = document.createElement('div');
        div.innerHTML = html;
        // 日付
        const time = div.querySelector('time');
        if (time) {
          const dateElem = card.querySelector('.blog-date');
          if (dateElem) {
            dateElem.textContent = time.textContent;
            dateElem.setAttribute('datetime', time.getAttribute('datetime'));
          }
        }
        // タイトル
        const h1 = div.querySelector('h1');
        if (h1) card.querySelector('h1').textContent = h1.textContent;
        // 本文1行目
        const firstP = div.querySelector('.blog-body p');
        if (firstP) card.querySelector('p').textContent = firstP.textContent.split('\n')[0];
        // タグ
        const tags = div.querySelector('.blog-tags');
        if (tags) card.querySelector('.work-tags').innerHTML = tags.innerHTML;
      });
  });
});

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
    // 行番号を追加
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