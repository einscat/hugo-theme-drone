(function() {
  // === 侧边栏光标跟随逻辑 ===
  const cursor = document.getElementById('sidebar-cursor');
  const tabs = document.querySelectorAll('.side-tab');

  function moveCursor(target) {
    if (!target || !cursor) return;

    // 获取 offsetTop (包含父容器 padding 的距离)
    const top = target.offsetTop;

    cursor.style.transform = `translateY(${top}px)`;
    cursor.style.opacity = '1';
  }

  // 初始化光标位置
  const activeTab = document.querySelector('.side-tab.active');
  // 延时一点点确保 CSS 渲染完成，位置计算准确
  if (activeTab) setTimeout(() => moveCursor(activeTab), 100);

  // 事件绑定
  tabs.forEach(tab => {
    tab.addEventListener('mouseenter', () => moveCursor(tab));
    tab.addEventListener('click', () => moveCursor(tab));
  });

  // 移出容器回弹
  const container = document.getElementById('sidebar-container');
  if(container) {
    container.addEventListener('mouseleave', () => {
      const current = document.querySelector('.side-tab.active');
      if(current) moveCursor(current);
    });
  }
})();

// === 视图切换逻辑 ===
// 挂载到 window 以便 HTML onclick 调用
window.switchView = function(viewName, btn) {
  // 1. 更新按钮状态
  document.querySelectorAll('.side-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.mobile-tab').forEach(el => el.classList.remove('active'));

  // 如果点击的是侧边栏按钮
  if (btn.classList.contains('side-tab')) {
    btn.classList.add('active');
  }
  // 如果点击的是移动端按钮
  if (btn.classList.contains('mobile-tab')) {
    btn.classList.add('active');
  }

  // 2. 切换内容视图
  // 隐藏所有视图
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

  // 显示目标视图
  const target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.remove('hidden');

    // 重置动画
    target.style.animation = 'none';
    target.offsetHeight; /* trigger reflow */
    target.style.animation = null;

    // 如果是搜索页，自动聚焦
    if (viewName === 'search') {
      setTimeout(() => document.getElementById('search-input')?.focus(), 100);
    }
  }
};
