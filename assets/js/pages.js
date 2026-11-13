let pagesAbort = null;

export function destroyPages() {
  if (pagesAbort) {
    pagesAbort.abort();
    pagesAbort = null;
  }
}

export function initPages() {
  destroyPages();

  pagesAbort = new AbortController();
  const { signal } = pagesAbort;

  // 1. 画意 (photos.md) 照片灯箱预览
  const photoImgs = document.querySelectorAll('.photo-item img');
  const lightboxOverlay = document.getElementById('lightbox-overlay');
  const lightboxImg = document.getElementById('lightbox-image');

  if (photoImgs.length > 0 && lightboxOverlay && lightboxImg) {
    const closeBtn = lightboxOverlay.querySelector('.lightbox-close');

    function closeLightbox() {
      lightboxOverlay.classList.remove('active');
      setTimeout(() => {
        if (!lightboxOverlay.classList.contains('active')) lightboxImg.src = '';
      }, 250);
    }

    photoImgs.forEach((img) => {
      img.addEventListener('click', () => {
        const src = img.getAttribute('src');
        if (!src) return;
        lightboxImg.src = src;
        lightboxOverlay.classList.add('active');
      }, { signal });
    });

    lightboxOverlay.addEventListener('click', (e) => {
      if (e.target === lightboxOverlay || (closeBtn && closeBtn.contains(e.target))) {
        closeLightbox();
      }
    }, { signal });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
        closeLightbox();
      }
    }, { signal });
  }

  // 2. 项目页微信小程序码预览弹窗
  const qrModal = document.getElementById('project-qrcode-modal');
  if (qrModal) {
    const closeBtn = document.getElementById('project-qrcode-close');
    const nameEl = document.getElementById('modal-project-name');
    const descEl = document.getElementById('modal-project-desc');
    const qrImg = document.getElementById('modal-project-qrcode');

    function closeQrModal() {
      qrModal.classList.add('hidden');
      qrModal.classList.remove('flex');
    }

    document.querySelectorAll('[data-open-qrcode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (nameEl) nameEl.textContent = btn.getAttribute('data-project-name') || '';
        if (descEl) descEl.textContent = btn.getAttribute('data-project-desc') || '';
        if (qrImg) qrImg.src = btn.getAttribute('data-open-qrcode') || '';
        qrModal.classList.remove('hidden');
        qrModal.classList.add('flex');
      }, { signal });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeQrModal, { signal });
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) closeQrModal();
    }, { signal });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !qrModal.classList.contains('hidden')) closeQrModal();
    }, { signal });
  }

  // 3. 关于 / 工具页筛选按钮
  const filterBtns = document.querySelectorAll('.filter-btn');
  const aboutCards = document.querySelectorAll('.about-card');
  const toolCards = document.querySelectorAll('.tool-card');

  if (filterBtns.length > 0 && (aboutCards.length > 0 || toolCards.length > 0)) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const filterValue = btn.getAttribute('data-filter');

        aboutCards.forEach((card) => {
          const match = filterValue === 'all' || card.getAttribute('data-id') === filterValue;
          card.classList.toggle('hidden', !match);
          if (match) {
            card.style.animation = 'none';
            void card.offsetHeight;
            card.style.animation = 'pjaxFadeIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards';
          }
        });

        toolCards.forEach((card) => {
          if (filterValue === 'all') {
            card.classList.remove('hidden');
          } else {
            const tags = (card.getAttribute('data-tags') || '').split(',');
            card.classList.toggle('hidden', !tags.includes(filterValue));
          }
        });
      }, { signal });
    });
  }
}

