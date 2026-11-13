const segmentMap = {
  0: [true, true, true, true, true, true, false],
  1: [false, true, true, false, false, false, false],
  2: [true, true, false, true, true, false, true],
  3: [true, true, true, true, false, false, true],
  4: [false, true, true, false, false, true, true],
  5: [true, false, true, true, false, true, true],
  6: [true, false, true, true, true, true, true],
  7: [true, true, true, false, false, false, false],
  8: [true, true, true, true, true, true, true],
  9: [true, true, true, true, false, true, true]
};

let clockTimer = null;

function updateDigit(elementId, value) {
  const svg = document.getElementById(elementId);
  if (!svg) return;

  const segments = segmentMap[value] || segmentMap[0];
  for (let i = 0; i < 7; i++) {
    const path = svg.querySelector(`.segment-${i}`);
    if (!path) continue;
    path.classList.toggle('fill-primary', segments[i]);
    path.classList.toggle('fill-black/5', !segments[i]);
  }
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  updateDigit('clock-h1', parseInt(h[0], 10));
  updateDigit('clock-h2', parseInt(h[1], 10));
  updateDigit('clock-m1', parseInt(m[0], 10));
  updateDigit('clock-m2', parseInt(m[1], 10));
  updateDigit('clock-s1', parseInt(s[0], 10));
  updateDigit('clock-s2', parseInt(s[1], 10));
}

export function destroyClock() {
  if (clockTimer !== null) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

export function initClock() {
  destroyClock();
  if (!document.getElementById('clock-h1')) return;
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
}
