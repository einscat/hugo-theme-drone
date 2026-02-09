(function() {
    function initNav() {
        const container = document.getElementById('nav-container');
        const cursor = document.getElementById('nav-cursor');
        const items = document.querySelectorAll('.nav-item');

        if (!container || !cursor || items.length === 0) return;

        // 默认选中的索引 (0 = 列表第一个)
        // 如果想默认不选中任何项，可以将 opacity 设为 0，并修改此处逻辑
        const defaultIndex = 0;

        function updateState(targetIndex) {
            const targetItem = items[targetIndex];
            if (!targetItem) return;

            // 1. 计算偏移量并移动光标
            // 使用 offsetTop 获取该项在容器内的相对位置
            const top = targetItem.offsetTop;
            cursor.style.transform = `translateY(${top}px)`;
            cursor.style.opacity = '1';

            // 2. 切换 active 类 (用于控制图标填充和文字颜色)
            items.forEach((item, idx) => {
                if (idx === targetIndex) {
                    item.classList.add('nav-active');
                } else {
                    item.classList.remove('nav-active');
                }
            });
        }

        // 延迟一点执行，确保 CSS 布局（如高度、Top值）已经计算完毕
        setTimeout(() => {
            updateState(defaultIndex);
        }, 100);

        // 鼠标移入：跟随
        items.forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                updateState(index);
            });
        });

        // 鼠标移出容器：回归默认
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