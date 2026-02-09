(function() {
    const titleEl = document.getElementById('calendar-title');
    const gridEl = document.getElementById('calendar-grid');
    if (!gridEl) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ...

    // 1. 设置标题 (例如: 2026/02/08 周日)
    const daysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    if(titleEl) {
        // 月份 +1 因为 getMonth() 是 0-11
        titleEl.textContent = `${year}/${String(month + 1).padStart(2, '0')}/${String(today).padStart(2, '0')} ${daysZh[dayOfWeek]}`;
    }

    // 2. 准备数据
    // 我们的日历是从“周一”开始排列的
    // 周日(0) -> 6, 周一(1) -> 0, ...
    const currentWeekdayIndex = (dayOfWeek + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayObj = new Date(year, month, 1);

    // 计算当月第一天前面需要空几个格子 (以周一为第一列)
    const firstDayPadding = (firstDayObj.getDay() + 6) % 7;

    let html = '';

    // 3. 生成星期表头 (一 ... 日)
    const headerLabels = ['一', '二', '三', '四', '五', '六', '日'];
    headerLabels.forEach((label, index) => {
        // 如果是今天所在的星期列，给个高亮颜色
        const isCurrentCol = index === currentWeekdayIndex;
        const className = isCurrentCol ? 'calendar-cell font-bold text-brand-highlight' : 'calendar-cell font-medium opacity-60';
        html += `<li class="${className}">${label}</li>`;
    });

    // 4. 填充月初的空白
    for(let i=0; i<firstDayPadding; i++) {
        html += `<li class="calendar-cell"></li>`;
    }

    // 5. 填充日期
    for(let d=1; d<=daysInMonth; d++) {
        const isToday = (d === today);
        if (isToday) {
            // 今天: 使用渐变背景 (bg-linear)
            html += `<li class="calendar-cell bg-linear font-medium rounded-lg shadow-md">${d}</li>`;
        } else {
            html += `<li class="calendar-cell rounded-lg">${d}</li>`;
        }
    }

    gridEl.innerHTML = html;
})();