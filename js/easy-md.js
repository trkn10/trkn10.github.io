(function(){
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char];
    });
  }

  function sanitizeUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '#';
    if (/^(https?:|mailto:|tel:|#|\/|\.\.\/|\.\/)/i.test(value)) {
      return escapeHtml(value);
    }
    return '#';
  }

  function easyMdParse(text) {
      let headings = [];
      let headingCount = 0;
      const codeBlocks = [];

    text = text.replace(/```([\s\S]*?)```/g, function (_, code) {
      const token = `__EASY_MD_CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push('<pre><code>' + escapeHtml(code) + '</code></pre>');
      return token;
    });
    text = escapeHtml(text);
    text = text.replace(/^###### (.*)$/gm, function(_, t) {
      headingCount++;
      const id = 'toc-h6-' + headingCount;
      headings.push({level:6, text:t, id});
      return `<h6 id="${id}">${t}</h6>`;
    });
    text = text.replace(/^##### (.*)$/gm, function(_, t) {
      headingCount++;
      const id = 'toc-h5-' + headingCount;
      headings.push({level:5, text:t, id});
      return `<h5 id="${id}">${t}</h5>`;
    });
    text = text.replace(/^#### (.*)$/gm, function(_, t) {
      headingCount++;
      const id = 'toc-h4-' + headingCount;
      headings.push({level:4, text:t, id});
      return `<h4 id="${id}">${t}</h4>`;
    });
    text = text.replace(/^### (.*)$/gm, function(_, t) {
      headingCount++;
      const id = 'toc-h3-' + headingCount;
      headings.push({level:3, text:t, id});
      return `<h3 id="${id}">${t}</h3>`;
    });
    text = text.replace(/^## (.*)$/gm, function(_, t) {
      headingCount++;
      const id = 'toc-h2-' + headingCount;
      headings.push({level:2, text:t, id});
      return `<h2 id="${id}">${t}</h2>`;
    });
    text = text.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // リスト
    text = text.replace(/^(\s*)- (.*)$/gm, '$1<li>$2</li>');
    text = text.replace(/(<li>.*<\/li>\n?)+/g, function (m) { return '<ul>' + m.replace(/\n/g, '') + '</ul>'; });
    // 画像
    text = text.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, function (_, alt, src) {
      return '<img src="' + sanitizeUrl(src) + '" alt="' + escapeHtml(alt) + '" class="blog-img">';
    });
    // 色付きテキスト
    const colorSpanRe = /\{\.(text-[a-z]+)\}([^\{\}]*)/g;
    let prev;
    do {
      prev = text;
      text = text.replace(colorSpanRe, function(_, cls, val) {
        return '<span class="' + cls + '">' + val + '</span>';
      });
    } while (text !== prev);
    // リンク
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, function (_, label, href) {
      return '<a href="' + sanitizeUrl(href) + '">' + label + '</a>';
    });
    text = text.replace(/__EASY_MD_CODE_BLOCK_(\d+)__/g, function (_, index) {
      return codeBlocks[Number(index)] || '';
    });
    // 段落
    text = text.replace(/(^|\n)(?!<h\d|<ul|<li|<img|<pre|<span|<a|<\/ul|<\/li|<\/pre|<\/span|<\/a)([^\n]+)/g, function (_, br, line) {
      if (line.trim() === '') return '';
      return '<p>' + line.trim() + '</p>';
    });

    // 目次
    if (text.includes('[TOC]') && headings.length) {
      let tocHtml = '<div class="easy-md-toc"><b>目次</b><ol style="padding-left:1.5em">';
      headings.forEach(h => {
        if (h.level === 2) {
          tocHtml += `<li class="toc-item toc-lv2"><a href="#${h.id}">${h.text}</a></li>`;
        }
      });
      tocHtml += '</ol></div>';
      text = text.replace('[TOC]', tocHtml);
    }
    return text;
  }
  window.easyMdParse = easyMdParse;
  document.addEventListener('DOMContentLoaded', function () {
    var src = document.getElementById('easy-md');
    var out = document.getElementById('easy-md-html');
    if (!src || !out) return;
    var text = src.textContent || src.innerText;
    out.innerHTML = easyMdParse(text);
    if (window.hljs) document.querySelectorAll('pre code').forEach(c => hljs.highlightElement(c));
    document.querySelectorAll('.easy-md-toc a').forEach(a => {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.getElementById(a.getAttribute('href').replace('#',''));
        if (target) {
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });
  });
})();
