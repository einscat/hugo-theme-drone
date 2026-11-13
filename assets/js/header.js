const STORAGE_KEY = 'drone_header_cursor_state';
let headerAbort = null;
let activeItem = null;

function readSavedState() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeSavedState(item) {
  if (!item) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      left: item.offsetLeft,
      width: item.offsetWidth,
      href: item.getAttribute('href') || ''
    }));
  } catch {}
}

export function clearHeaderState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function moveCursorTo(cursor, item, immediate = false) {
  if (!cursor) return;
  if (!item) {
    cursor.style.opacity = '0';
    return;
  }
  const left = item.offsetLeft;
  const width = item.offsetWidth;
  if (width <= 0) return;

  if (immediate) {
    cursor.style.transition = 'none';
  }
  cursor.style.width = `${width}px`;
  cursor.style.transform = `translateX(${left}px)`;
  cursor.style.opacity = '1';

  if (immediate) {
    void cursor.offsetWidth;
    cursor.style.transition = '';
  }
}

function updateItemVisuals(items, hoverItem) {
  items.forEach((item) => {
    const isHovered = item === hoverItem;
    const isActiveOriginal = item === activeItem;
    const showActive = isHovered || (!hoverItem && isActiveOriginal);

    const outline = item.querySelector('.header-icon-outline');
    const filled = item.querySelector('.header-icon-filled');
    const text = item.querySelector('.header-nav-text');

    if (outline) outline.style.opacity = showActive ? '0' : '0.7';
    if (filled) filled.style.opacity = showActive ? '1' : '0';
    if (text) {
      text.style.color = showActive ? 'var(--color-primary, #4E3F42)' : '';
      text.style.fontWeight = showActive ? '700' : '500';
    }
  });
}

export function initHeader() {
  if (headerAbort) {
    headerAbort.abort();
    headerAbort = null;
  }

  const navContainer = document.getElementById('header-nav-container');
  const cursor = document.getElementById('header-cursor');
  const items = Array.from(document.querySelectorAll('.header-nav-item'));

  if (!navContainer || !cursor || items.length === 0) {
    activeItem = null;
    return;
  }

  headerAbort = new AbortController();
  const { signal } = headerAbort;

  activeItem = items.find((item) => item.getAttribute('data-active') === 'true') || null;

  if (activeItem && activeItem.offsetWidth > 0) {
    const currentLeft = activeItem.offsetLeft;
    const currentWidth = activeItem.offsetWidth;
    const currentHref = activeItem.getAttribute('href') || '';
    const prevState = readSavedState();

    cursor.style.transition = 'none';
    cursor.style.opacity = '1';

    if (prevState && prevState.width > 0 && prevState.href && prevState.href !== currentHref) {
      cursor.style.width = `${prevState.width}px`;
      cursor.style.transform = `translateX(${prevState.left}px)`;
      void cursor.offsetWidth;
      cursor.style.transition = '';
      requestAnimationFrame(() => {
        cursor.style.width = `${currentWidth}px`;
        cursor.style.transform = `translateX(${currentLeft}px)`;
      });
    } else {
      cursor.style.width = `${currentWidth}px`;
      cursor.style.transform = `translateX(${currentLeft}px)`;
      void cursor.offsetWidth;
      requestAnimationFrame(() => {
        cursor.style.transition = '';
      });
    }

    writeSavedState(activeItem);
  }

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      moveCursorTo(cursor, item);
      updateItemVisuals(items, item);
    }, { signal });

    item.addEventListener('touchstart', () => {
      activeItem = item;
      moveCursorTo(cursor, item);
      updateItemVisuals(items, item);
    }, { passive: true, signal });

    item.addEventListener('click', () => {
      activeItem = item;
      moveCursorTo(cursor, item);
      updateItemVisuals(items, null);
      writeSavedState(item);
    }, { signal });
  });

  navContainer.addEventListener('mouseleave', () => {
    moveCursorTo(cursor, activeItem);
    updateItemVisuals(items, null);
  }, { signal });

  window.addEventListener('resize', () => {
    moveCursorTo(cursor, activeItem, true);
  }, { signal });
}

/**
 * PJAX 保持 <header> DOM 不重建时，根据新文档同步选中状态并平滑滑动顶部胶囊
 */
export function syncHeaderFromDoc(nextDoc) {
  const currentHeader = document.getElementById('site-header');
  const nextHeader = nextDoc.getElementById('site-header');
  if (!currentHeader || !nextHeader) return false;

  const cursor = document.getElementById('header-cursor');
  const currentItems = Array.from(currentHeader.querySelectorAll('.header-nav-item'));
  const nextItems = Array.from(nextHeader.querySelectorAll('.header-nav-item'));

  if (currentItems.length !== nextItems.length) return false;

  let newActive = null;
  currentItems.forEach((item, idx) => {
    const isActive = nextItems[idx].getAttribute('data-active') === 'true';
    item.setAttribute('data-active', isActive ? 'true' : '');

    const outline = item.querySelector('.header-icon-outline');
    const filled = item.querySelector('.header-icon-filled');
    const text = item.querySelector('.header-nav-text');

    if (outline) {
      outline.classList.toggle('opacity-0', isActive);
      outline.style.opacity = '';
    }
    if (filled) {
      filled.classList.toggle('opacity-100', isActive);
      filled.style.opacity = '';
    }
    if (text) {
      text.classList.toggle('text-primary', isActive);
      text.classList.toggle('font-bold', isActive);
      text.style.color = '';
      text.style.fontWeight = '';
    }

    if (isActive) newActive = item;
  });

  activeItem = newActive;
  moveCursorTo(cursor, activeItem, false);
  if (activeItem) writeSavedState(activeItem);
  return true;
}

