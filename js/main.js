// ブログ記事リスト（ここに記事を追加するだけでOK）
const blogArticles = [
  { url: '/blogs/20260111/index.html' },
  { url: '/blogs/20260121/index.html' }
  // 例: { url: '/blogs/20260112/index.html' }, ...
];

document.addEventListener('DOMContentLoaded', function () {
  const list = document.getElementById('blog-list');
  if (!list) return;
  const searchInput = document.getElementById('blog-search');
  const cards = [];

  function filterArticles() {
    const keyword = (searchInput?.value || '').trim().toLowerCase();
    cards.forEach(card => {
      const text = card.dataset.searchText || '';
      card.style.display = (!keyword || text.includes(keyword)) ? '' : 'none';
    });
  }

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
    cards.push(card);

    fetch(article.url)
      .then(res => res.text())
      .then(html => {
        const div = document.createElement('div');
        div.innerHTML = html;

        const time = div.querySelector('time');
        if (time) {
          const dateElem = card.querySelector('.blog-date');
          if (dateElem) {
            dateElem.textContent = time.textContent;
            dateElem.setAttribute('datetime', time.getAttribute('datetime'));
          }
        }

        const h1 = div.querySelector('h1');
        if (h1) card.querySelector('h1').textContent = h1.textContent;

        const firstP = div.querySelector('.blog-body p');
        if (firstP) card.querySelector('p').textContent = firstP.textContent.split('\n')[0];

        const tags = div.querySelector('.blog-tags');
        if (tags) card.querySelector('.work-tags').innerHTML = tags.innerHTML;

        const tagText = tags ? tags.textContent : '';
        const titleText = h1 ? h1.textContent : '';
        const bodyText = firstP ? firstP.textContent.split('\n')[0] : '';
        card.dataset.searchText = `${titleText} ${tagText} ${bodyText}`.toLowerCase();
        filterArticles();
      });
  });

  if (searchInput) {
    searchInput.addEventListener('input', filterArticles);
  }
});

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

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.blog-body pre > code').forEach(function (code) {
    const pre = code.parentElement;

    let wrapper = pre.parentElement;
    if (!wrapper || !wrapper.classList || !wrapper.classList.contains('code-wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      pre.parentElement.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }

    if (!pre.querySelector('.code-lines')) {
      const lines = code.textContent.replace(/\n+$/, '').split('\n');
      const lineCount = lines.length;
      const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('<br>');
      const span = document.createElement('span');
      span.className = 'code-lines';
      span.innerHTML = lineNumbers;
      pre.insertBefore(span, code);
    }

    if (!wrapper.querySelector('.copy-btn')) {
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
      wrapper.appendChild(btn);
    }
  });

  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 200) {
        scrollBtn.style.display = 'block';
      } else {
        scrollBtn.style.display = 'none';
      }
    });
    scrollBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
    scrollBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});