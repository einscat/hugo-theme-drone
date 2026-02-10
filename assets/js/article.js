document.addEventListener('DOMContentLoaded', function() {
    const scrollContainer = document.getElementById('scroll-container');

    // =========================================
    // 1. 代码块优化 (Code Block Clean & Copy)
    // =========================================

    function trimCodeBlock(codeElement) {
        // 移除头部的空行
        let first = codeElement.firstChild;
        while (first && first.nodeType === Node.TEXT_NODE && /^\s*$/.test(first.textContent)) {
            let next = first.nextSibling;
            codeElement.removeChild(first);
            first = next;
        }
        if (first && first.nodeType === Node.TEXT_NODE) {
            first.textContent = first.textContent.replace(/^\n+/, '');
        }

        // 移除尾部的空行
        let last = codeElement.lastChild;
        while (last && last.nodeType === Node.TEXT_NODE && /^\s*$/.test(last.textContent)) {
            let prev = last.previousSibling;
            codeElement.removeChild(last);
            last = prev;
        }
        if (last && last.nodeType === Node.TEXT_NODE) {
            last.textContent = last.textContent.replace(/\n+$/, '');
        }
    }

    document.querySelectorAll('pre').forEach((pre) => {
        // 避免重复处理
        if (pre.parentNode.classList.contains('code-block-wrapper')) return;

        const code = pre.querySelector('code');
        if (code) trimCodeBlock(code);

        // 获取语言
        let lang = 'TEXT';
        if (code && code.className) {
            const match = code.className.match(/language-(\w+)/);
            if (match) lang = match[1].toUpperCase();
        }

        // 构建容器
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `<span>${lang}</span><button class="code-copy-btn"><span>Copy</span></button>`;

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);

        // 复制功能
        header.querySelector('.code-copy-btn').addEventListener('click', function() {
            const btn = this;
            let text = code ? code.textContent : pre.textContent;
            text = text.trim();

            navigator.clipboard.writeText(text).then(() => {
                btn.innerHTML = `<span style="color:#10b981">Copied!</span>`;
                setTimeout(() => { btn.innerHTML = `<span>Copy</span>`; }, 2000);
            });
        });
    });

    // =========================================
    // 2. 目录高亮 (TOC Highlight)
    // =========================================

    const tocLinks = document.querySelectorAll('.sidebar-toc a');
    const headings = document.querySelectorAll('.layout-content h2, .layout-content h3, .layout-content h4');

    if (tocLinks.length > 0 && headings.length > 0) {
        const observerOptions = {
            root: scrollContainer,
            rootMargin: '-100px 0px -70% 0px',
            threshold: 0
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    tocLinks.forEach(link => link.classList.remove('active'));
                    const activeLink = document.querySelector(`.sidebar-toc a[href="#${id}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, observerOptions);
        headings.forEach(heading => observer.observe(heading));
    }

    // =========================================
    // 3. 图片放大 (Lightbox)
    // =========================================

    const overlay = document.getElementById('lightbox-overlay');

    // 核心逻辑：只有当页面存在 lightbox-overlay 元素时（即配置开启时），才绑定事件
    if (overlay) {
        const images = document.querySelectorAll('.layout-content img');
        const lightboxImg = document.getElementById('lightbox-image');
        const closeBtn = document.querySelector('.lightbox-close');

        // 打开
        images.forEach(img => {
            // 只有在图片上添加了 cursor: zoom-in 样式时才认为可点击（CSS控制）
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                lightboxImg.src = this.src;
                lightboxImg.alt = this.alt;
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        // 关闭逻辑
        function closeLightbox() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => { lightboxImg.src = ''; }, 300);
        }

        closeBtn.addEventListener('click', closeLightbox);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeLightbox();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                closeLightbox();
            }
        });
    }
});