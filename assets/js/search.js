const FUSE_CDN = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.basic.min.js';

let fuseLoadPromise = null;
let cachedFuse = null;
let lastQuery = '';
let searchAbort = null;

export function ensureFuseLoaded() {
  if (typeof window.Fuse !== 'undefined') return Promise.resolve();
  if (fuseLoadPromise) return fuseLoadPromise;

  fuseLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = FUSE_CDN;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      fuseLoadPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });
  return fuseLoadPromise;
}

function getSmartSnippet(content, summary, keyword) {
  if (!keyword || !content) return summary;
  const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(safeKeyword, 'i');
  const matchIndex = content.search(regex);
  if (matchIndex === -1) return summary;

  const start = Math.max(0, matchIndex - 50);
  const end = Math.min(content.length, matchIndex + 100);
  let snippet = content.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  return snippet;
}

function highlightText(text, keyword) {
  if (!keyword || !text) return text;
  const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeKeyword})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function renderTags(tags) {
  if (!tags || tags.length === 0) return '';
  return `
    <div class="flex flex-wrap gap-2">
      ${tags.map((tag) => `
        <span class="text-xs text-secondary/60 bg-white/50 px-2 py-0.5 rounded-full border border-white/40">
          #${tag}
        </span>
      `).join('')}
    </div>
  `;
}

export function initSearch() {
  if (searchAbort) {
    searchAbort.abort();
    searchAbort = null;
  }

  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const loadingIcon = document.getElementById('search-loading');
  if (!searchInput || !resultsContainer) return;

  searchAbort = new AbortController();
  const { signal } = searchAbort;

  const searchIndexPath = searchInput.dataset.indexPath || '/index.json';
  let isLoading = false;
  let debounceTimer;

  function renderResults(results, query) {
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center py-10">
          <p class="text-secondary/50 font-averia text-lg">No results found for "${query}".</p>
        </div>`;
      return;
    }

    resultsContainer.innerHTML = results.slice(0, 20).map((result) => {
      const item = result.item;
      const rawSnippet = getSmartSnippet(item.content, item.summary, query);
      const highlightedTitle = highlightText(item.title, query);
      const highlightedSnippet = highlightText(rawSnippet, query);

      return `
        <a href="${item.permalink}" class="group block relative pl-5 sm:pl-8 border-l-2 border-dashed border-black/5 hover:border-brand/30 transition-colors duration-300 mb-5 sm:mb-6 no-underline">
          <span class="absolute -left-[9px] top-5 sm:top-6 w-4 h-4 rounded-full bg-white border-2 border-secondary/20 group-hover:border-brand group-hover:bg-brand/10 transition-colors box-content"></span>
          <div class="p-4 sm:p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:bg-white/60 transition-all duration-300">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-2">
              <h3 class="text-base sm:text-xl font-bold text-primary group-hover:text-brand transition-colors font-averia leading-snug">
                ${highlightedTitle}
              </h3>
              <span class="text-xs font-mono text-secondary/50 bg-white/50 px-2 py-0.5 sm:py-1 rounded-md shrink-0 self-start">
                ${item.date}
              </span>
            </div>
            <p class="text-secondary/80 text-sm leading-relaxed mb-4 line-clamp-2">
              ${highlightedSnippet}
            </p>
            ${renderTags(item.tags)}
          </div>
        </a>
      `;
    }).join('');
  }

  function performSearch(query) {
    lastQuery = query;
    if (!cachedFuse) return;
    renderResults(cachedFuse.search(query), query);
  }

  async function loadSearchIndex() {
    if (cachedFuse || isLoading) return;
    isLoading = true;
    if (loadingIcon) loadingIcon.classList.remove('hidden');

    try {
      const [_, response] = await Promise.all([
        ensureFuseLoaded(),
        fetch(searchIndexPath)
      ]);
      if (!response.ok) throw new Error('Failed to load search index');

      const data = await response.json();
      cachedFuse = new window.Fuse(data, {
        keys: [
          { name: 'title', weight: 0.8 },
          { name: 'tags', weight: 0.5 },
          { name: 'summary', weight: 0.3 },
          { name: 'content', weight: 0.1 }
        ],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2
      });

      const currentVal = searchInput.value.trim();
      if (currentVal.length > 0) {
        performSearch(currentVal);
      }
    } catch (error) {
      console.error('Search index load failed:', error);
      resultsContainer.innerHTML = '<div class="text-center text-secondary/50 py-10">Search service unavailable.</div>';
    } finally {
      isLoading = false;
      if (loadingIcon) loadingIcon.classList.add('hidden');
    }
  }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (query.length === 0) {
      lastQuery = '';
      resultsContainer.innerHTML = `
        <div class="text-center py-20 opacity-50">
          <p class="text-secondary/30 font-averia text-lg">Type something to start searching</p>
        </div>`;
      return;
    }

    if (!cachedFuse) {
      loadSearchIndex();
      return;
    }

    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 220);
  }, { signal });

  searchInput.addEventListener('focus', loadSearchIndex, { signal });

  // 若用户从搜索结果返回搜索页，恢复上次关键词与结果
  if (lastQuery && cachedFuse) {
    searchInput.value = lastQuery;
    performSearch(lastQuery);
  } else if (searchInput.value.trim()) {
    loadSearchIndex();
  }
}
