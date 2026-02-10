document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const loadingIcon = document.getElementById('search-loading');

    // 尝试从 HTML 获取路径，如果没有则默认 /index.json
    const searchIndexPath = searchInput.dataset.indexPath || '/index.json';

    let fuse;
    let isLoaded = false;
    let isLoading = false;
    let debounceTimer;

    /**
     * 1. 初始化与数据加载 (懒加载模式)
     * 只有用户聚焦输入框时才加载数据
     */
    async function loadSearchIndex() {
        if (isLoaded || isLoading) return;

        isLoading = true;
        loadingIcon.classList.remove('hidden');

        try {
            const response = await fetch(searchIndexPath);
            if (!response.ok) throw new Error("Failed to load search index");

            const data = await response.json();

            const options = {
                keys: [
                    { name: 'title', weight: 0.8 },
                    { name: 'tags', weight: 0.5 },
                    { name: 'summary', weight: 0.3 },
                    { name: 'content', weight: 0.1 }
                ],
                threshold: 0.3, // 匹配阈值
                ignoreLocation: true,
                minMatchCharLength: 2
            };

            fuse = new Fuse(data, options);
            isLoaded = true;

            // 如果加载完成时输入框里已经有字，立即搜索
            if (searchInput.value.trim().length > 0) {
                performSearch(searchInput.value.trim());
            }

        } catch (error) {
            console.error("Search index load failed:", error);
            resultsContainer.innerHTML = `<div class="text-center text-secondary/50 py-10">Search service unavailable.</div>`;
        } finally {
            isLoading = false;
            loadingIcon.classList.add('hidden');
        }
    }

    /**
     * 2. 监听输入 (包含防抖逻辑)
     */
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // 清除上一次的定时器
        clearTimeout(debounceTimer);

        if (query.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center py-20 opacity-50">
                    <p class="text-secondary/30 font-averia text-lg">Type something to start searching</p>
                </div>`;
            return;
        }

        // 如果还没加载数据，先触发加载
        if (!isLoaded) {
            loadSearchIndex();
            return;
        }

        // 延迟 300ms 执行搜索，避免频繁计算
        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // 监听聚焦，提前预加载数据
    searchInput.addEventListener('focus', loadSearchIndex);

    /**
     * 3. 执行搜索主逻辑
     */
    function performSearch(query) {
        if (!fuse) return;

        const results = fuse.search(query);
        renderResults(results, query);
    }

    /**
     * 4. 智能摘要截取函数 (新增核心功能)
     * 在 content 中寻找关键词，并截取前后文本
     */
    function getSmartSnippet(content, summary, keyword) {
        // 如果没有内容或关键词，回退到默认摘要
        if (!keyword || !content) return summary;

        // 转义关键词用于正则
        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeKeyword, 'i'); // 忽略大小写

        // 查找关键词位置
        const matchIndex = content.search(regex);

        // 如果正文里没找到（可能在标题或Tag里），直接返回默认摘要
        if (matchIndex === -1) return summary;

        // 截取逻辑：关键词前 50 字符 ~ 关键词后 100 字符
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(content.length, matchIndex + 100);

        let snippet = content.substring(start, end);

        // 添加省略号
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';

        return snippet;
    }

    /**
     * 5. 关键词高亮工具函数
     * 使用自定义 CSS 类 .search-highlight
     */
    function highlightText(text, keyword) {
        if (!keyword || !text) return text;

        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeKeyword})`, 'gi');

        // 使用自定义类名，防止 Tailwind 清除样式
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * 6. 渲染搜索结果列表
     */
    function renderResults(results, query) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center py-10">
                    <p class="text-secondary/50 font-averia text-lg">No results found for "${query}".</p>
                </div>`;
            return;
        }

        const html = results.slice(0, 20).map(result => {
            const item = result.item;

            // A. 获取智能摘要 (优先从 content 截取，没有则用 summary)
            const rawSnippet = getSmartSnippet(item.content, item.summary, query);

            // B. 高亮处理 (标题 和 智能摘要)
            const highlightedTitle = highlightText(item.title, query);
            const highlightedSnippet = highlightText(rawSnippet, query);

            return `
            <a href="${item.permalink}" class="group block relative pl-8 border-l-2 border-dashed border-black/5 hover:border-brand/30 transition-colors duration-300 mb-6">
                <span class="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-white border-2 border-secondary/20 group-hover:border-brand group-hover:bg-brand/10 transition-colors box-content"></span>
                
                <div class="p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:bg-white/60 transition-all duration-300">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-primary group-hover:text-brand transition-colors font-averia">
                            ${highlightedTitle}
                        </h3>
                        <span class="text-xs font-mono text-secondary/50 bg-white/50 px-2 py-1 rounded-md shrink-0 ml-4">
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

        resultsContainer.innerHTML = html;
    }

    function renderTags(tags) {
        if (!tags || tags.length === 0) return '';
        return `
            <div class="flex flex-wrap gap-2">
                ${tags.map(tag => `
                    <span class="text-xs text-secondary/60 bg-white/50 px-2 py-0.5 rounded-full border border-white/40">
                        #${tag}
                    </span>
                `).join('')}
            </div>
        `;
    }
});