(function() {
    function initNav() {
        const container = document.getElementById('nav-container');
        const cursor = document.getElementById('nav-cursor');
        const items = document.querySelectorAll('.nav-item');

        if (!container || !cursor || items.length === 0) return;

        // 默认选中的索引 (0 = 笔记)
        const defaultIndex = 0;

        // 更新光标位置 & 更新图标颜色状态
        function updateState(targetIndex) {
            const targetItem = items[targetIndex];
            if (!targetItem) return;

            // 1. 移动光标
            const top = targetItem.offsetTop;
            cursor.style.transform = `translateY(${top}px)`;
            cursor.style.opacity = '1';

            // 2. 更新颜色状态 (.nav-active)
            items.forEach((item, idx) => {
                if (idx === targetIndex) {
                    item.classList.add('nav-active');
                } else {
                    item.classList.remove('nav-active');
                }
            });
        }

        // 初始化: 激活默认项
        // 使用 requestAnimationFrame 或 setTimeout 确保 CSS 渲染就绪
        setTimeout(() => {
            updateState(defaultIndex);
        }, 50);

        // 监听鼠标移入项
        items.forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                updateState(index);
            });
        });

        // 监听鼠标移出整个容器 -> 回归到默认项
        container.addEventListener('mouseleave', () => {
            updateState(defaultIndex);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
})();
