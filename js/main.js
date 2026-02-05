// ブログ記事リスト（ここに記事を追加するだけでOK）
const blogArticles = [
  // ここに追加
  { url: '/blogs/20260121/index.html' },
  { url: '/blogs/20260111/index.html' }
];

document.addEventListener('DOMContentLoaded', function () {
  const list = document.getElementById('blog-list');
  const searchInput = document.getElementById('blog-search');
  const cards = [];

  function filterArticles() {
    const keyword = (searchInput?.value || '').trim().toLowerCase();
    cards.forEach(card => {
      const text = card.dataset.searchText || '';
      card.style.display = (!keyword || text.includes(keyword)) ? '' : 'none';
    });
  }

  function enableTagSearch(container) {
    if (!container) return;
    container.querySelectorAll('.work-tag').forEach(tag => {
      tag.style.cursor = 'pointer';
      tag.addEventListener('click', function (e) {
        e.preventDefault();
        if (searchInput) {
          searchInput.value = '#' + tag.textContent.replace(/^#/, '');
          filterArticles();
          searchInput.focus();
        }
      });
    });
  }

  if (list) {
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

          // タイトル
          const h1 = div.querySelector('h1');
          if (h1) card.querySelector('h1').textContent = h1.textContent;
          const titleText = h1 ? h1.textContent : '';

          // タグ
          const tags = div.querySelector('.blog-tags');
          if (tags) card.querySelector('.work-tags').innerHTML = tags.innerHTML;
          const tagText = tags ? tags.textContent : '';

          // 本文1行目
          function setPreview() {
            let firstLine = '';
            let bodyText = '';
            const easyMdScript = div.querySelector('#easy-md');
            if (easyMdScript) {
              if (window.easyMdParse) {
                const dummy = document.createElement('div');
                dummy.innerHTML = window.easyMdParse(easyMdScript.textContent || easyMdScript.innerText);
                const pList = dummy.querySelectorAll('p');
                console.log('easy-md preview <p> list:', pList);
                for (const p of pList) {
                  const txt = p.textContent.trim();
                  console.log('easy-md preview candidate:', txt);
                  if (txt) {
                    firstLine = txt.split('\n')[0];
                    bodyText = firstLine;
                    break;
                  }
                }
              } else {
                setTimeout(setPreview, 50);
                return;
              }
            } else {
              const firstP = div.querySelector('.blog-body p');
              if (firstP) {
                firstLine = firstP.textContent.split('\n')[0];
                bodyText = firstLine;
              }
            }
            card.querySelector('p').textContent = firstLine;
            // 日付
            const time = div.querySelector('time');
            if (time) {
              const dateElem = card.querySelector('.blog-date');
              if (dateElem) {
                dateElem.textContent = time.textContent;
                dateElem.setAttribute('datetime', time.getAttribute('datetime'));
              }
            }
            // 検索対象テキスト
            card.dataset.searchText = `${titleText} ${tagText} ${bodyText}`.toLowerCase();
            filterArticles();
            enableTagSearch(card.querySelector('.work-tags'));
          }
          setPreview();
        });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterArticles);
  }

  if (document.querySelector('.blog-body')) {
    document.querySelectorAll('.work-tag').forEach(tag => {
      tag.style.cursor = 'pointer';
      tag.addEventListener('click', function (e) {
        e.preventDefault();
        const keyword = encodeURIComponent('#' + tag.textContent.replace(/^#/, ''));
        window.location.href = '/blog.html?tag=' + keyword;
      });
    });
  }

  if (searchInput && window.location.search.includes('tag=')) {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('tag');
    if (tag) {
      searchInput.value = tag.startsWith('#') ? tag : ('#' + tag);
      filterArticles();
      searchInput.focus();
    }
  }
});

(function () {
  const modeBtn = document.getElementById('toggle-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('color-mode');

  function updateHljsTheme(isDark) {
    try {
      const lightHref = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
      const darkHref = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css';
      let link = document.getElementById('hljs-theme');
      const href = isDark ? darkHref : lightHref;
      if (link) {
        if (link.href !== href) link.href = href;
      } else {
        link = document.createElement('link');
        link.id = 'hljs-theme';
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    } catch (e) {
    }
  }
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
      updateHljsTheme(isDark);
    });
    setIcon(document.body.classList.contains('dark-mode'));
    updateHljsTheme(document.body.classList.contains('dark-mode'));
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  if (window.hljs && typeof window.hljs === 'object') {
    try {
      const isDark = document.body.classList.contains('dark-mode');
      const lightHref = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
      const darkHref = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css';
      let link = document.getElementById('hljs-theme');
      const href = isDark ? darkHref : lightHref;
      if (link) {
        if (link.href !== href) link.href = href;
      } else {
        link = document.createElement('link');
        link.id = 'hljs-theme';
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    } catch (e) { }
  }

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

    try {
      if (window.hljs && typeof window.hljs.highlightElement === 'function') {
        window.hljs.highlightElement(code);
      }
    } catch (e) {
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