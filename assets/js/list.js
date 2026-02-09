(function() {
  // === 侧边栏光标跟随逻辑 ===
  const cursor = document.getElementById('sidebar-cursor');
  const tabs = document.querySelectorAll('.side-tab');
  const container = document.querySelector('aside');

  if (!cursor) return;

  function moveCursor(target) {
    if (!target) return;
    const top = target.offsetTop;
    // 使用 CSS transform 进行位移，性能更好
    cursor.style.transform = `translateY(${top}px)`;
    cursor.style.opacity = '1';
  }

  // 1. 初始化：找到当前高亮的 tab (.active) 并移动光标
  const activeTab = document.querySelector('.side-tab.active');
  if (activeTab) {
    // 延时确保布局稳定
    setTimeout(() => moveCursor(activeTab), 100);
  }

  // 2. 鼠标悬停事件
  tabs.forEach(tab => {
    tab.addEventListener('mouseenter', () => moveCursor(tab));
  });

  // 3. 鼠标移出容器：光标回到 active 元素
  if(container) {
    container.addEventListener('mouseleave', () => {
      // 重新获取 active 元素 (因为页面跳转后DOM会变，但这里是mouseleave逻辑)
      const current = document.querySelector('.side-tab.active');
      if(current) {
        moveCursor(current);
      } else {
        // 如果当前页面没有 active (比如详情页的返回按钮)，隐藏光标
        cursor.style.opacity = '0';
      }
    });
  }
})();