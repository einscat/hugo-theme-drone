document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const loadingIcon = document.getElementById('search-loading');

    let fuse;
    let data;

    async function initSearch() {
        try {
            loadingIcon.classList.remove('hidden');
            const response = await fetch('/index.json');
            if (!response.ok) throw new Error("Failed to load search index");

            data = await response.json();

            const options = {
                keys: [
                    { name: 'title', weight: 0.7 },
                    { name: 'tags', weight: 0.2 },
                    { name: 'summary', weight: 0.1 }
                ],
                threshold: 0.4,
                ignoreLocation: true
            };

            fuse = new Fuse(data, options);
            loadingIcon.classList.add('hidden');

        } catch (error) {
            console.error(error);
            loadingIcon.classList.add('hidden');
        }
    }

    searchInput.addEventListener('input', (e) => {
        if (!fuse) return;

        const query = e.target.value.trim();

        if (query.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center py-20 opacity-50">
                    <p class="text-secondary/30 font-averia text-lg">Type something to start searching</p>
                </div>`;
            return;
        }

        const results = fuse.search(query);
        renderResults(results);
    });

    function renderResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center py-10">
                    <p class="text-secondary/50 font-averia text-lg">No results found.</p>
                </div>`;
            return;
        }

        // 生成与 list.html 宽度一致的卡片
        const html = results.map(item => {
            const post = item.item;
            return `
            <a href="${post.permalink}" class="group block relative pl-8 border-l-2 border-dashed border-black/5 hover:border-brand/30 transition-colors duration-300">
                <span class="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-white border-2 border-secondary/20 group-hover:border-brand group-hover:bg-brand/10 transition-colors box-content"></span>
                
                <div class="p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:bg-white/60 transition-all duration-300">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-2xl font-bold text-primary group-hover:text-brand transition-colors font-averia">
                            ${post.title}
                        </h3>
                        <span class="text-xs font-mono text-secondary/50 bg-white/50 px-2 py-1 rounded-md shrink-0 ml-4">
                            ${post.date}
                        </span>
                    </div>
                    
                    <p class="text-secondary/80 text-base leading-relaxed mb-4 line-clamp-2">
                        ${post.summary}
                    </p>

                    ${renderTags(post.tags)}
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

    initSearch();
});