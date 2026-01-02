(function() {
    const titleEl = document.getElementById('calendar-title');
    const gridEl = document.getElementById('calendar-grid');
    if (!gridEl) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const dayOfWeek = now.getDay(); // 0=Sun

    // 1. 设置标题 (2024/12/29 周日)
    const daysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    if(titleEl) {
        titleEl.textContent = `${year}/${month + 1}/${today} ${daysZh[dayOfWeek]}`;
    }

    // 2. 准备数据
    // 当前周几索引 (转换周一为首: 0=Mon ... 6=Sun)
    const currentWeekdayIndex = (dayOfWeek + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayObj = new Date(year, month, 1);
    // 当月第一天前面的空白数
    const firstDayPadding = (firstDayObj.getDay() + 6) % 7;

    let html = '';

    // 3. 生成星期表头 (一 ... 日)
    const headerLabels = ['一', '二', '三', '四', '五', '六', '日'];
    headerLabels.forEach((label, index) => {
        // 当前星期列高亮
        const isCurrentCol = index === currentWeekdayIndex;
        const className = isCurrentCol ? 'calendar-cell font-medium text-brand-highlight' : 'calendar-cell font-medium';
        html += `<li class="${className}">${label}</li>`;
    });

    // 4. 填充空白
    for(let i=0; i<firstDayPadding; i++) {
        html += `<li class="calendar-cell"></li>`;
    }

    // 5. 填充日期
    for(let d=1; d<=daysInMonth; d++) {
        const isToday = (d === today);
        if (isToday) {
            // 今天: bg-linear
            html += `<li class="calendar-cell bg-linear font-medium rounded-lg">${d}</li>`;
        } else {
            html += `<li class="calendar-cell rounded-lg">${d}</li>`;
        }
    }

    gridEl.innerHTML = html;
})();
