let listAbort = null;
let sidebarInitialized = false;

function moveSidebarCursor(target, immediate = false) {
  const cursor = document.getElementById('sidebar-cursor');
  if (!cursor) return;
  if (!target) {
    cursor.style.opacity = '0';
    return;
  }

  const top = target.offsetTop;
  if (immediate) {
    cursor.style.transition = 'none';
  }
  cursor.style.transform = `translateY(${top}px)`;
  cursor.style.opacity = '1';
  if (immediate) {
    void cursor.offsetWidth;
    cursor.style.transition = '';
  }
}

export function syncSidebarCursor(immediate = !sidebarInitialized) {
  const activeTab = document.querySelector('.side-tab.active');
  if (activeTab) {
    moveSidebarCursor(activeTab, immediate);
    sidebarInitialized = true;
  } else {
    moveSidebarCursor(null, immediate);
  }
}

export function resetSidebarState() {
  sidebarInitialized = false;
}

export function applyPostHashRoute() {
  const viewColumns = document.getElementById('posts-view-columns');
  const viewColumnDetail = document.getElementById('posts-view-column-detail');
  const viewTimeline = document.getElementById('posts-view-timeline');
  if (!viewColumns || !viewTimeline) return;

  const scrollContainer = document.getElementById('scroll-container');
  const hash = window.location.hash || '';
  const isPaginatedPath = /\/page\/\d+/.test(window.location.pathname);

  function setNavActiveView(mode) {
    document.querySelectorAll('[data-post-view]').forEach((el) => {
      const isMatch = el.getAttribute('data-post-view') === mode;
      if (el.classList.contains('side-tab')) {
        el.classList.toggle('active', isMatch);
      } else if (el.classList.contains('mobile-tab')) {
        el.classList.toggle('active', isMatch);
        el.classList.toggle('text-white', isMatch);
        el.classList.toggle('bg-brand', isMatch);
        el.classList.toggle('shadow-sm', isMatch);
        el.classList.toggle('text-secondary', !isMatch);
      }
    });
    requestAnimationFrame(() => syncSidebarCursor());
  }

  function showColumnsOverview() {
    viewColumns.classList.remove('hidden');
    if (viewColumnDetail) viewColumnDetail.classList.add('hidden');
    viewTimeline.classList.add('hidden');
    setNavActiveView('columns');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }

  function showColumnDetail(colKey) {
    if (!viewColumnDetail) return;
    const panels = viewColumnDetail.querySelectorAll('[data-column-panel]');
    let found = false;
    panels.forEach((panel) => {
      const match = panel.getAttribute('data-column-panel') === colKey;
      panel.classList.toggle('hidden', !match);
      if (match) found = true;
    });
    if (!found) {
      showColumnsOverview();
      return;
    }
    viewColumns.classList.add('hidden');
    viewColumnDetail.classList.remove('hidden');
    viewTimeline.classList.add('hidden');
    setNavActiveView('columns');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }

  function showTimelineView() {
    viewColumns.classList.add('hidden');
    if (viewColumnDetail) viewColumnDetail.classList.add('hidden');
    viewTimeline.classList.remove('hidden');
    setNavActiveView('timeline');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }

  if (hash === '#timeline' || (isPaginatedPath && hash === '')) {
    showTimelineView();
  } else if (hash.startsWith('#col-')) {
    showColumnDetail(decodeURIComponent(hash.slice(5)));
  } else {
    showColumnsOverview();
  }
}

export function initList() {
  if (listAbort) {
    listAbort.abort();
    listAbort = null;
  }

  const cursor = document.getElementById('sidebar-cursor');
  const sideTabs = document.querySelectorAll('.side-tab');
  const container = document.querySelector('.left-tab-nav aside');
  const viewColumns = document.getElementById('posts-view-columns');
  const viewTimeline = document.getElementById('posts-view-timeline');

  if (!cursor && !viewColumns && !viewTimeline) return;

  listAbort = new AbortController();
  const { signal } = listAbort;

  // 专栏卡片入口（避免重复绑定）
  document.querySelectorAll('[data-open-column]').forEach((trigger) => {
    if (trigger.dataset.bound === '1') return;
    trigger.dataset.bound = '1';
    trigger.addEventListener('click', () => {
      const colKey = trigger.getAttribute('data-open-column');
      if (colKey) {
        history.pushState({ pjax: true, url: location.href }, '', `#col-${encodeURIComponent(colKey)}`);
        applyPostHashRoute();
      }
    });
  });

  // 返回全部专栏按钮
  document.querySelectorAll('[data-back-columns]').forEach((btn) => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      history.pushState({ pjax: true, url: location.href }, '', '#columns');
      applyPostHashRoute();
    });
  });

  // 侧边栏与移动端顶部「专栏 / Year」切换按钮（在 /posts/ 内直接切视图）
  document.querySelectorAll('[data-post-view]').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const currentViewCols = document.getElementById('posts-view-columns');
      const currentViewTimeline = document.getElementById('posts-view-timeline');
      if (currentViewCols && currentViewTimeline) {
        e.preventDefault();
        const targetView = tab.getAttribute('data-post-view');
        const targetHash = targetView === 'timeline' ? '#timeline' : '#columns';
        if (window.location.hash !== targetHash) {
          history.pushState({ pjax: true, url: location.href }, '', targetHash);
        }
        applyPostHashRoute();
      }
    }, { signal });
  });

  window.addEventListener('hashchange', applyPostHashRoute, { signal });

  applyPostHashRoute();
  requestAnimationFrame(() => syncSidebarCursor());

  if (cursor && container) {
    sideTabs.forEach((tab) => {
      tab.addEventListener('mouseenter', () => moveSidebarCursor(tab), { signal });
    });
    container.addEventListener('mouseleave', () => syncSidebarCursor(false), { signal });
  }
}
