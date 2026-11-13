let articleAbort = null;
let tocObserver = null;

function trimCodeBlock(codeElement) {
  let first = codeElement.firstChild;
  while (first && first.nodeType === Node.TEXT_NODE && /^\s*$/.test(first.textContent)) {
    const next = first.nextSibling;
    codeElement.removeChild(first);
    first = next;
  }
  if (first && first.nodeType === Node.TEXT_NODE) {
    first.textContent = first.textContent.replace(/^\n+/, '');
  }

  let last = codeElement.lastChild;
  while (last && last.nodeType === Node.TEXT_NODE && /^\s*$/.test(last.textContent)) {
    const prev = last.previousSibling;
    codeElement.removeChild(last);
    last = prev;
  }
  if (last && last.nodeType === Node.TEXT_NODE) {
    last.textContent = last.textContent.replace(/\n+$/, '');
  }
}

export function destroyArticle() {
  if (articleAbort) {
    articleAbort.abort();
    articleAbort = null;
  }
  if (tocObserver) {
    tocObserver.disconnect();
    tocObserver = null;
  }
}

export function initArticle() {
  destroyArticle();

  const articleRoot = document.querySelector('.article-main');
  if (!articleRoot) return;

  articleAbort = new AbortController();
  const { signal } = articleAbort;
  const scrollContainer = document.getElementById('scroll-container');

  // 1. 代码块包装与复制按钮
  document.querySelectorAll('.article-card pre').forEach((pre) => {
    if (
      pre.classList.contains('mermaid') ||
      pre.closest('.mermaid-container') ||
      (pre.parentNode && pre.parentNode.classList.contains('code-block-wrapper'))
    ) {
      return;
    }

    const code = pre.querySelector('code');
    if (code) trimCodeBlock(code);

    let lang = 'TEXT';
    if (code && code.className) {
      const match = code.className.match(/language-(\w+)/);
      if (match) lang = match[1].toUpperCase();
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `<span>${lang}</span><button class="code-copy-btn"><span>Copy</span></button>`;

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    header.querySelector('.code-copy-btn').addEventListener('click', function () {
      const btn = this;
      const text = (code ? code.textContent : pre.textContent).trim();
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<span style="color:#10b981">Copied!</span>';
        setTimeout(() => { btn.innerHTML = '<span>Copy</span>'; }, 2000);
      });
    }, { signal });
  });

  // 2. 目录格式化与滚动高亮
  const tocLinks = document.querySelectorAll('.sidebar-toc a');
  tocLinks.forEach((link) => {
    if (link.dataset.formatted === '1') return;
    link.dataset.formatted = '1';
    const text = link.textContent;
    link.setAttribute('title', text.trim());
    const regex = /^([0-9]+(\.[0-9]+)*([.、]|(?=\s))|第[一二三四五六七八九十百0-9]+[步阶段章节集回][：:]*|[一二三四五六七八九十0-9]+[、.])/;
    const match = text.match(regex);
    if (match) {
      const prefix = match[0];
      const rest = text.substring(prefix.length).trim();
      link.innerHTML = `<span class="heading-number">${prefix}</span>${rest}`;
    }
  });

  const headings = document.querySelectorAll('.layout-content h2, .layout-content h3, .layout-content h4');
  if (tocLinks.length > 0 && headings.length > 0) {
    tocObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tocLinks.forEach((link) => link.classList.remove('active'));
          const activeLink = document.querySelector(`.sidebar-toc a[href="#${CSS.escape(id)}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, {
      root: scrollContainer,
      rootMargin: '-100px 0px -70% 0px',
      threshold: 0
    });
    headings.forEach((heading) => tocObserver.observe(heading));
  }

  // 3. 目录宽度拖拽
  const handle = document.querySelector('.sidebar-resize-handle');
  const sidebar = document.querySelector('.sidebar-inner');
  if (handle && sidebar) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    function doDrag(e) {
      if (!isResizing) return;
      const width = startWidth + (e.clientX - startX);
      if (width >= 180 && width <= 600) {
        sidebar.style.width = `${width}px`;
      }
    }

    function stopDrag() {
      if (!isResizing) return;
      isResizing = false;
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
      document.body.style.userSelect = '';
      handle.classList.remove('resizing');
    }

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
      document.body.style.userSelect = 'none';
      handle.classList.add('resizing');
    }, { signal });
  }

  // 4. 文章图片放大 (Lightbox)
  const overlay = document.getElementById('lightbox-overlay');
  if (overlay) {
    const images = document.querySelectorAll('.layout-content img');
    const lightboxImg = document.getElementById('lightbox-image');
    const closeBtn = overlay.querySelector('.lightbox-close');

    function closeLightbox() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!overlay.classList.contains('active') && lightboxImg) lightboxImg.src = '';
      }, 250);
    }

    images.forEach((img) => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!lightboxImg) return;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }, { signal });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox, { signal });
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    }, { signal });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeLightbox();
    }, { signal });
  }
}
