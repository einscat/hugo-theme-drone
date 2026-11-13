let navAbort = null;

export function initNav() {
  if (navAbort) {
    navAbort.abort();
    navAbort = null;
  }

  const container = document.getElementById('nav-container');
  const cursor = document.getElementById('nav-cursor');
  const items = document.querySelectorAll('.nav-item');

  if (!container || !cursor || items.length === 0) return;

  navAbort = new AbortController();
  const { signal } = navAbort;

  const defaultIndex = 0;
  let currentIndex = defaultIndex;

  function updateState(targetIndex) {
    const targetItem = items[targetIndex];
    if (!targetItem) return;

    currentIndex = targetIndex;
    const left = targetItem.offsetLeft;
    const top = targetItem.offsetTop;
    const width = targetItem.offsetWidth;
    const height = targetItem.offsetHeight;

    cursor.style.width = `${width}px`;
    cursor.style.height = `${height}px`;
    cursor.style.transform = `translate(${left}px, ${top}px)`;
    cursor.style.opacity = '1';

    items.forEach((item, idx) => {
      item.classList.toggle('nav-active', idx === targetIndex);
    });
  }

  requestAnimationFrame(() => updateState(defaultIndex));

  window.addEventListener('resize', () => {
    updateState(currentIndex);
  }, { signal });

  items.forEach((item, index) => {
    item.addEventListener('mouseenter', () => updateState(index), { signal });
    item.addEventListener('touchstart', () => updateState(index), { passive: true, signal });
    item.addEventListener('click', () => updateState(index), { signal });
  });

  container.addEventListener('mouseleave', () => updateState(defaultIndex), { signal });
}
