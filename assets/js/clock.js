(function() {
    // 0-9 的数码管映射表 (true 为亮，false 为灭)
    // 对应 SVG 中的 segment-0 到 segment-6
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

    function updateDigit(elementId, value) {
        const svg = document.getElementById(elementId);
        if (!svg) return;

        const segments = segmentMap[value] || segmentMap[0];

        // 遍历 segment-0 到 segment-6
        for (let i = 0; i < 7; i++) {
            const path = svg.querySelector(`.segment-${i}`);
            if (path) {
                if (segments[i]) {
                    // 激活: 变为品牌主色 (var(--color-brand) 或 var(--color-primary))
                    // 这里使用 fill-primary (在 Tailwind 配置中对应 #4E3F42)
                    // 如果你想让数字是红色的，可以改成 fill-brand
                    path.classList.remove('fill-black/5');
                    path.classList.add('fill-primary');
                } else {
                    // 熄灭: 变为浅灰色
                    path.classList.remove('fill-primary');
                    path.classList.add('fill-black/5');
                }
            }
        }
    }

    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        updateDigit('clock-h1', parseInt(h[0]));
        updateDigit('clock-h2', parseInt(h[1]));
        updateDigit('clock-m1', parseInt(m[0]));
        updateDigit('clock-m2', parseInt(m[1]));
        updateDigit('clock-s1', parseInt(s[0]));
        updateDigit('clock-s2', parseInt(s[1]));
    }

    // 立即运行一次，然后每秒更新
    updateClock();
    setInterval(updateClock, 1000);
})();
