import { initHeader, syncHeaderFromDoc, clearHeaderState } from './header.js';
import { initClock, destroyClock } from './clock.js';
import { initCalendar } from './calendar.js';
import { initNav } from './nav.js';
import { initList, syncSidebarCursor, resetSidebarState } from './list.js';
import { initArticle, destroyArticle } from './article.js';
import { initSearch, ensureFuseLoaded } from './search.js';
import { initPages, destroyPages } from './pages.js';

(function () {
  const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  const docCache = new Map();
  const scrollMemory = new Map();
  let internalHistoryDepth = 0;
  let activeNavigationId = 0;
  let mermaidLoadPromise = null;
  let currentPathKey = normalizeRouteKey(window.location.href);

  function normalizeRouteKey(url) {
    try {
      const u = new URL(url, window.location.origin);
      return u.pathname + u.search;
    } catch {
      return url;
    }
  }

  function isPjaxEligibleLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.getAttribute('data-no-pjax') === 'true') return false;
    const target = anchor.getAttribute('target');
    if (target && target !== '_self') return false;

    const rawHref = anchor.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) {
      return false;
    }

    try {
      const parsed = new URL(anchor.href, window.location.origin);
      if (parsed.origin !== window.location.origin) return false;
      // 同一页面内仅改变 hash 的跳转交给原生或 list.js 处理
      if (parsed.pathname === window.location.pathname && parsed.search === window.location.search) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  function fetchDocument(url) {
    const key = normalizeRouteKey(url);
    if (docCache.has(key)) return docCache.get(key);

    const promise = fetch(url, { headers: { 'X-Requested-With': 'drone-pjax' } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) throw new Error('Not HTML');
        return res.text();
      })
      .then((html) => new DOMParser().parseFromString(html, 'text/html'))
      .catch((err) => {
        docCache.delete(key);
        throw err;
      });

    docCache.set(key, promise);
    return promise;
  }

  function prefetchUrl(url) {
    if (!url) return;
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin) return;
      if (parsed.pathname === window.location.pathname && parsed.search === window.location.search) return;

      fetchDocument(parsed.href).catch(() => {});
      if (parsed.pathname.includes('/search')) {
        ensureFuseLoaded().catch(() => {});
      }
    } catch {}
  }

  function ensureMermaidRendered() {
    const nodes = document.querySelectorAll('.mermaid:not([data-processed="true"])');
    if (nodes.length === 0) return;

    function runMermaid() {
      if (typeof window.mermaid === 'undefined') return;
      window.mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.getAttribute('data-mermaid-theme') || 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
      });
      window.mermaid.run({ querySelector: '.mermaid:not([data-processed="true"])' }).catch(() => {});
    }

    if (typeof window.mermaid !== 'undefined') {
      runMermaid();
      return;
    }

    if (!mermaidLoadPromise) {
      const cdn = document.documentElement.getAttribute('data-mermaid-cdn') || MERMAID_CDN;
      mermaidLoadPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = cdn;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    mermaidLoadPromise.then(runMermaid).catch(() => {});
  }

  function cleanupCurrentPage() {
    document.querySelectorAll('video').forEach((v) => {
      if (!v.paused) v.pause();
    });
    destroyClock();
    destroyArticle();
    destroyPages();
  }

  function initCurrentPage({ headerPreserved = false, sidebarPreserved = false } = {}) {
    if (!document.getElementById('site-header')) {
      clearHeaderState();
    } else if (!headerPreserved) {
      initHeader();
    }

    initClock();
    initCalendar();
    initNav();
    if (!sidebarPreserved) {
      resetSidebarState();
    }
    initList();
    initArticle();
    initSearch();
    initPages();
    ensureMermaidRendered();
  }

  function triggerEnterAnimation(el) {
    if (!el) return;
    el.classList.remove('pjax-entering');
    void el.offsetWidth;
    el.classList.add('pjax-entering');
  }

  /**
   * 同步固定叠加层（Lightbox / 二维码弹窗），保证主容器外层切换后弹层仍存在
   */
  function syncOverlays(currentMain, nextMain) {
    ['lightbox-overlay', 'project-qrcode-modal'].forEach((id) => {
      const curEl = currentMain.querySelector(`#${id}`);
      const nextEl = nextMain.querySelector(`#${id}`);
      if (curEl) curEl.remove();
      if (nextEl) currentMain.appendChild(document.importNode(nextEl, true));
    });
  }

  /**
   * 智能局部 DOM 替换：尽可能保留顶栏 Header、二级 Tab 栏、笔记左侧栏，只替换变动的内容面板
   */
  function applyDomSwap(nextDoc) {
    const currentMain = document.getElementById('pjax-main') || document.querySelector('main');
    const nextMain = nextDoc.getElementById('pjax-main') || nextDoc.querySelector('main');
    if (!currentMain || !nextMain) return null;

    document.title = nextDoc.title;

    const curShell = currentMain.querySelector('[data-pjax-shell]');
    const nextShell = nextMain.querySelector('[data-pjax-shell]');
    const curHeader = currentMain.querySelector('#site-header');
    const nextHeader = nextMain.querySelector('#site-header');

    // 情况 1：首页 <-> 内页（布局外壳完全不同），整块淡入替换 <main>
    if (!curShell || !nextShell || !curHeader || !nextHeader) {
      currentMain.innerHTML = nextMain.innerHTML;
      triggerEnterAnimation(currentMain.firstElementChild || currentMain);
      return { headerPreserved: false, sidebarPreserved: false };
    }

    // 所有内页之间切换：始终保持顶部 Header DOM 原地不动，直接滑动顶部游标！
    const headerSynced = syncHeaderFromDoc(nextDoc);

    // 情况 2：同属「行知路」(一念 · 悦❤️读 · 画意 · 幕语 · 读书笔记详情)，保留顶部二级 Tab 栏原地不动
    const curSubnav = curShell.querySelector('[data-subnav-group="journey"]');
    const nextSubnav = nextShell.querySelector('[data-subnav-group="journey"]');
    if (curSubnav && nextSubnav) {
      // 同步二级导航高亮
      const curSubLinks = curSubnav.querySelectorAll('.layout-sub-nav a');
      const nextSubLinks = nextSubnav.querySelectorAll('.layout-sub-nav a');
      curSubLinks.forEach((a, i) => {
        const nextA = nextSubLinks[i];
        if (nextA) a.classList.toggle('active', nextA.classList.contains('active'));
      });

      // 同步引用语 (.layout-quote)
      const curHeaderBox = curSubnav.querySelector('.layout-fixed-header');
      const curQuote = curHeaderBox ? curHeaderBox.querySelector('.layout-quote') : null;
      const nextQuote = nextSubnav.querySelector('.layout-quote');
      if (curHeaderBox) {
        if (curQuote && nextQuote) {
          curQuote.textContent = nextQuote.textContent;
        } else if (curQuote && !nextQuote) {
          curQuote.remove();
        } else if (!curQuote && nextQuote) {
          curHeaderBox.appendChild(document.importNode(nextQuote, true));
        }
      }

      // 同步左侧返回按钮 (书架无，读书笔记详情有)
      const curLeftNav = curShell.querySelector('.left-tab-nav');
      const nextLeftNav = nextShell.querySelector('.left-tab-nav');
      if (curLeftNav) curLeftNav.remove();
      if (nextLeftNav) {
        const headerWrapper = curShell.querySelector('[data-pjax-header]');
        if (headerWrapper) {
          headerWrapper.insertAdjacentElement('afterend', document.importNode(nextLeftNav, true));
        }
      }

      // 仅替换内部滚动内容区域
      const curScroll = curShell.querySelector('#scroll-container');
      const nextScroll = nextShell.querySelector('#scroll-container');
      if (curScroll && nextScroll) {
        curScroll.innerHTML = nextScroll.innerHTML;
        triggerEnterAnimation(curScroll.firstElementChild);
        syncOverlays(currentMain, nextMain);
        return { headerPreserved: headerSynced, sidebarPreserved: false };
      }
    }

    // 情况 3：同属「笔记列表集合」(专栏/Year <-> Tags <-> Tag详情 <-> Search)，保留左侧栏与移动端 Tab 栏原地不动
    const curSidebarCursor = curShell.querySelector('#sidebar-cursor');
    const nextSidebarCursor = nextShell.querySelector('#sidebar-cursor');
    const curListContainer = curShell.querySelector('#scroll-container .list-container');
    const nextListContainer = nextShell.querySelector('#scroll-container .list-container');

    if (curSidebarCursor && nextSidebarCursor && curListContainer && nextListContainer) {
      // 同步桌面端左侧 .side-tab 状态并平滑移动 #sidebar-cursor
      const curSideTabs = curShell.querySelectorAll('.left-tab-nav .side-tab');
      const nextSideTabs = nextShell.querySelectorAll('.left-tab-nav .side-tab');
      curSideTabs.forEach((tab, i) => {
        if (nextSideTabs[i]) {
          tab.classList.toggle('active', nextSideTabs[i].classList.contains('active'));
        }
      });

      // 同步移动端顶部 .mobile-tab-nav 激活状态
      const curMobNav = curShell.querySelector('.mobile-tab-nav');
      const nextMobNav = nextShell.querySelector('.mobile-tab-nav');
      if (curMobNav && nextMobNav) {
        const curMobTabs = curMobNav.querySelectorAll('.mobile-tab');
        const nextMobTabs = nextMobNav.querySelectorAll('.mobile-tab');
        curMobTabs.forEach((tab, i) => {
          if (nextMobTabs[i]) {
            tab.className = nextMobTabs[i].className;
          }
        });
      }

      // 仅替换列表主体 .list-container
      curListContainer.innerHTML = nextListContainer.innerHTML;
      triggerEnterAnimation(curListContainer.firstElementChild);
      syncOverlays(currentMain, nextMain);
      requestAnimationFrame(() => syncSidebarCursor(false));
      return { headerPreserved: headerSynced, sidebarPreserved: true };
    }

    // 情况 4：跨大模块切换（如 行知路 <-> 笔记 <-> 我的项目 <-> 关于，或 笔记列表 <-> 文章详情）
    // 保持顶部 #site-header 原地不动，仅替换 header 下方的主体区域
    const curHeaderWrap = curShell.querySelector('[data-pjax-header]');
    const nextHeaderWrap = nextShell.querySelector('[data-pjax-header]');
    if (curHeaderWrap && nextHeaderWrap) {
      while (curHeaderWrap.nextSibling) {
        curHeaderWrap.nextSibling.remove();
      }
      let node = nextHeaderWrap.nextSibling;
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT') {
          const imported = document.importNode(node, true);
          curShell.appendChild(imported);
          if (imported.matches('[data-pjax-body]') || imported.querySelector('#scroll-container')) {
            const innerTarget = imported.querySelector('#scroll-container > *') || imported;
            triggerEnterAnimation(innerTarget);
          }
        }
        node = node.nextSibling;
      }
      syncOverlays(currentMain, nextMain);
      return { headerPreserved: headerSynced, sidebarPreserved: false };
    }

    // 兜底：整体替换 <main>
    currentMain.innerHTML = nextMain.innerHTML;
    triggerEnterAnimation(currentMain.firstElementChild || currentMain);
    return { headerPreserved: false, sidebarPreserved: false };
  }

  async function navigatePjax(url, { push = true } = {}) {
    const navId = ++activeNavigationId;

    // 离开前保存当前滚动位置
    const currentScroll = document.getElementById('scroll-container');
    scrollMemory.set(currentPathKey, currentScroll ? currentScroll.scrollTop : window.scrollY);

    let nextDoc;
    try {
      nextDoc = await fetchDocument(url);
    } catch {
      window.location.href = url;
      return;
    }

    // 如果在加载期间又触发了更新的点击，放弃过期结果
    if (navId !== activeNavigationId) return;

    cleanupCurrentPage();

    if (push) {
      internalHistoryDepth++;
      history.pushState({ pjax: true, url }, '', url);
    }

    const nextKey = normalizeRouteKey(url);
    currentPathKey = nextKey;

    const swapResult = applyDomSwap(nextDoc);
    if (!swapResult) {
      window.location.href = url;
      return;
    }

    initCurrentPage(swapResult);

    // 滚动位置处理：前进到新页面归零（或定位锚点），浏览器后退/前进恢复原位置
    const newScroll = document.getElementById('scroll-container');
    const targetHash = new URL(url, window.location.origin).hash;
    if (!push && scrollMemory.has(nextKey)) {
      const savedTop = scrollMemory.get(nextKey);
      if (newScroll) newScroll.scrollTop = savedTop;
    } else if (targetHash && !['#columns', '#timeline'].includes(targetHash) && !targetHash.startsWith('#col-')) {
      const targetId = decodeURIComponent(targetHash.slice(1));
      const anchorEl = document.getElementById(targetId);
      if (anchorEl) anchorEl.scrollIntoView();
      else if (newScroll) newScroll.scrollTop = 0;
    } else if (newScroll) {
      newScroll.scrollTop = 0;
    }
  }

  // 1. 鼠标悬停 / 手指触碰：后台静默预取目标页面并解析缓存
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (isPjaxEligibleLink(a)) prefetchUrl(a.href);
  }, { passive: true });

  document.addEventListener('touchstart', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (isPjaxEligibleLink(a)) prefetchUrl(a.href);
  }, { passive: true });

  // 2. 全局拦截站内点击，实现全站无刷新连贯切换
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // 返回按钮优先回退到精确历史来源（如某专栏或搜索结果页）
    const backBtn = e.target.closest && e.target.closest('a[data-pjax-back]');
    if (backBtn) {
      if (internalHistoryDepth > 0 || (history.length > 1 && document.referrer.includes(window.location.host))) {
        e.preventDefault();
        history.back();
        return;
      }
    }

    // 二级导航按钮即时高亮反馈
    const subNavLink = e.target.closest && e.target.closest('.layout-sub-nav a');
    if (subNavLink) {
      const nav = subNavLink.closest('.layout-sub-nav');
      if (nav) {
        nav.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
        subNavLink.classList.add('active');
      }
    }

    const a = e.target.closest && e.target.closest('a[href]');
    if (!isPjaxEligibleLink(a)) return;

    e.preventDefault();
    navigatePjax(a.href, { push: true });
  });

  // 3. 浏览器前进 / 后退按钮兼容（区别站内哈希与跨路由切换）
  window.addEventListener('popstate', () => {
    const nextKey = normalizeRouteKey(window.location.href);
    if (nextKey === currentPathKey) {
      // 同路由仅 hash 变化（如 /posts/#col-go <-> /posts/#columns）
      return;
    }
    navigatePjax(window.location.href, { push: false });
  });

  // 4. 视频互斥播放
  document.addEventListener('play', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== e.target && !v.paused) v.pause();
      });
    }
  }, true);

  // 5. 首次加载初始化
  function boot() {
    history.replaceState({ pjax: true, url: window.location.href }, '', window.location.href);
    initCurrentPage({ headerPreserved: false, sidebarPreserved: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
