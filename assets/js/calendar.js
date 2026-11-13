export function initCalendar() {
  const titleEl = document.getElementById('calendar-title');
  const gridEl = document.getElementById('calendar-grid');
  if (!gridEl) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const dayOfWeek = now.getDay();

  const daysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  if (titleEl) {
    titleEl.textContent = `${year}/${String(month + 1).padStart(2, '0')}/${String(today).padStart(2, '0')} ${daysZh[dayOfWeek]}`;
  }

  const currentWeekdayIndex = (dayOfWeek + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayPadding = (new Date(year, month, 1).getDay() + 6) % 7;

  let html = '';
  const headerLabels = ['一', '二', '三', '四', '五', '六', '日'];
  headerLabels.forEach((label, index) => {
    const className = index === currentWeekdayIndex
      ? 'calendar-cell font-bold text-brand-highlight'
      : 'calendar-cell font-medium opacity-60';
    html += `<li class="${className}">${label}</li>`;
  });

  for (let i = 0; i < firstDayPadding; i++) {
    html += '<li class="calendar-cell"></li>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    if (d === today) {
      html += `<li class="calendar-cell bg-linear font-medium rounded-lg shadow-md">${d}</li>`;
    } else {
      html += `<li class="calendar-cell rounded-lg">${d}</li>`;
    }
  }

  gridEl.innerHTML = html;
}
