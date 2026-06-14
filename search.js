/**
 * Command Palette Search
 * Keyboard-first search experience with fuzzy matching
 */

(function() {
    'use strict';

    // State
    let fuse = null;
    let searchIndex = [];
    let selectedIndex = 0;
    let results = [];
    let isOpen = false;
    let lastTrackedQuery = '';

    // DOM Elements (will be created)
    let overlay, modal, input, resultsContainer, clearBtn, closeBtn, cancelBtn;
    let lastFocused = null;

    // Fuse.js options for fuzzy search
    const fuseOptions = {
        keys: [
            { name: 'title', weight: 0.4 },
            { name: 'description', weight: 0.3 },
            { name: 'keywords', weight: 0.2 },
            { name: 'category', weight: 0.1 }
        ],
        threshold: 0.4,
        distance: 100,
        includeMatches: true,
        minMatchCharLength: 2
    };

    // Icons
    const icons = {
        search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
        document: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
        empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`
    };

    function currentLocale() {
        const firstSegment = window.location.pathname.split('/').filter(Boolean)[0] || '';
        return ['fr', 'es'].includes(firstSegment) ? firstSegment : 'en';
    }

    function filterIndexForCurrentLocale(index) {
        const locale = currentLocale();
        const localized = index.filter(item => (item.locale || 'en') === locale);
        if (localized.length) return localized;
        return index.filter(item => (item.locale || 'en') === 'en');
    }

    /**
     * Initialize search functionality
     */
    async function init() {
        try {
            // Load Fuse.js from CDN
            await loadFuseJS();

            // Load search index
            await loadSearchIndex();

            // Create DOM elements
            createSearchUI();

            // Bind events
            bindEvents();
            buildTOC();

            if (window.__openSearchOnLoad) {
                window.__openSearchOnLoad = false;
                openSearch();
            }

            console.log('Search initialized successfully');
        } catch (error) {
            console.error('Failed to initialize search:', error);
        }
    }

    /**
     * Load Fuse.js library from CDN
     */
    function loadFuseJS() {
        return new Promise((resolve, reject) => {
            if (window.Fuse) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Load search index JSON
     */
    async function loadSearchIndex() {
        const response = await fetch('/search-index.json');
        const fullIndex = await response.json();
        searchIndex = filterIndexForCurrentLocale(fullIndex);
        fuse = new Fuse(searchIndex, fuseOptions);
    }

    /**
     * Create search UI elements
     */
    function createSearchUI() {
        // Create overlay
        overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.innerHTML = '';

        // Create modal
        modal = document.createElement('div');
        modal.className = 'search-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Search guides');

        modal.innerHTML = `
            <div class="search-input-wrapper">
                ${icons.search}
                <input
                    type="text"
                    class="search-input"
                    placeholder="Search guides..."
                    autocomplete="off"
                    aria-label="Search"
                    aria-controls="search-results-listbox"
                    aria-expanded="true"
                >
                <button class="search-clear" type="button" aria-label="Clear search" title="Clear">
                    ×
                </button>
                <button class="search-close" type="button" aria-label="Close search" title="Close">
                    ×
                </button>
                <div class="search-shortcut">
                    <kbd>esc</kbd>
                </div>
            </div>
            <div class="search-results" role="listbox" id="search-results-listbox" aria-live="polite"></div>
            <div class="search-footer">
                <span class="search-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span class="search-hint"><kbd>↵</kbd> select</span>
                <span class="search-hint"><kbd>esc</kbd> close</span>
            </div>
            <button class="search-cancel" type="button">Cancel</button>
        `;

        // Add to DOM
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Get references
        input = modal.querySelector('.search-input');
        resultsContainer = modal.querySelector('.search-results');
        clearBtn = modal.querySelector('.search-clear');
        closeBtn = modal.querySelector('.search-close');
        cancelBtn = modal.querySelector('.search-cancel');

        // Show initial state
        showEmptyState();
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Keyboard shortcut to open (Cmd/Ctrl + K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }

            // Also open with / key when not in input
            if (e.key === '/' && !isInputFocused()) {
                e.preventDefault();
                openSearch();
            }
        });

        // Close on overlay click
        overlay.addEventListener('click', closeSearch);

        // Close on Escape
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeSearch();
            }
        });

        // Input handling
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeyNavigation);
        input.addEventListener('input', toggleClearButton);

        // Clear and close buttons
        clearBtn.addEventListener('click', () => {
            input.value = '';
            toggleClearButton();
            showTopResults();
            input.focus();
        });
        closeBtn.addEventListener('click', closeSearch);
        cancelBtn.addEventListener('click', closeSearch);

        // Search trigger buttons
        document.querySelectorAll('.search-trigger').forEach(btn => {
            btn.addEventListener('click', openSearch);
        });

        // Focus trap inside modal
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            trapFocus(e);
        });
    }

    /**
     * Check if user is typing in an input field
     */
    function isInputFocused() {
        const active = document.activeElement;
        return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    }

    /**
     * Open search modal
     */
    function openSearch() {
        isOpen = true;
        lastFocused = document.activeElement;
        overlay.classList.add('active');
        modal.classList.add('active');
        input.value = '';
        input.focus();
        selectedIndex = 0;
        toggleClearButton();
        showTopResults();
        document.body.style.overflow = 'hidden';
        trackSearch('search_open');
    }

    /**
     * Close search modal
     */
    function closeSearch() {
        isOpen = false;
        overlay.classList.remove('active');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }

    /**
     * Handle input changes
     */
    function handleInput(e) {
        const query = e.target.value.trim();

        if (!query) {
            lastTrackedQuery = '';
            showTopResults();
            return;
        }

        // Perform search
        results = fuse.search(query, { limit: 20 });
        results = prioritizeExactTitle(query, results).slice(0, 8);
        selectedIndex = 0;

        if (results.length === 0) {
            showNoResults(query);
        } else {
            renderResults();
        }

        trackSearchQuery(query, results.length);
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyNavigation(e) {
        if (results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                updateSelection();
                break;

            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateSelection();
                break;

            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    navigateToResult(results[selectedIndex].item);
                }
                break;
        }
    }

    /**
     * Show empty state
     */
    function showEmptyState() {
        results = [];
        resultsContainer.innerHTML = `
            <div class="search-empty">
                ${icons.empty}
                <p>Type to search guides...</p>
            </div>
        `;
    }

    /**
     * Show top results when no query
     */
    function showTopResults() {
        const top = searchIndex.slice(0, 6).map(item => ({ item, matches: [] }));
        if (top.length === 0) {
            showEmptyState();
            return;
        }
        results = top;
        selectedIndex = 0;
        resultsContainer.innerHTML = `
            <div class="search-section-title">Top guides</div>
            ${results.map((result, index) => {
                const item = result.item;
                const isSelected = index === selectedIndex;
                return `
                    <a href="${item.url}"
                       class="search-result ${isSelected ? 'selected' : ''}"
                       role="option"
                       aria-selected="${isSelected}"
                       id="search-result-${index}"
                       data-index="${index}"
                       data-url="${item.url}"
                       data-title="${escapeHtml(item.title)}">
                        <div class="search-result-header">
                            <span class="search-result-icon">${icons.document}</span>
                            <span class="search-result-title">${escapeHtml(item.title)}</span>
                            <span class="search-result-category">${escapeHtml(item.category || '')}</span>
                        </div>
                        <div class="search-result-description">${escapeHtml(item.description || '')}</div>
                    </a>
                `;
            }).join('')}
        `;

        resultsContainer.querySelectorAll('.search-result').forEach(el => {
            el.addEventListener('click', () => {
                trackSearchResultClick(el);
            });
            el.addEventListener('mouseenter', () => {
                selectedIndex = parseInt(el.dataset.index, 10);
                updateSelection();
            });
        });

        updateSelection();
    }

    /**
     * Show no results message
     */
    function showNoResults(query) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <p>No results for "${escapeHtml(query)}"</p>
            </div>
        `;
        trackSearch('search_empty', {
            search_term: query
        });
    }

    /**
     * Render search results
     */
    function renderResults() {
        resultsContainer.innerHTML = results.map((result, index) => {
            const item = result.item;
            const isSelected = index === selectedIndex;

            // Highlight matches in title and description
            let title = highlightMatches(item.title, result.matches, 'title');
            let description = highlightMatches(item.description, result.matches, 'description');

            return `
                <a href="${item.url}"
                   class="search-result ${isSelected ? 'selected' : ''}"
                   role="option"
                   aria-selected="${isSelected}"
                   id="search-result-${index}"
                   data-index="${index}"
                   data-url="${item.url}"
                   data-title="${escapeHtml(item.title)}">
                    <div class="search-result-header">
                        <span class="search-result-icon">${icons.document}</span>
                        <span class="search-result-title">${title}</span>
                        <span class="search-result-category">${item.category}</span>
                    </div>
                    <div class="search-result-description">${description}</div>
                </a>
            `;
        }).join('');

        // Add click handlers to results
        resultsContainer.querySelectorAll('.search-result').forEach(el => {
            el.addEventListener('click', (e) => {
                trackSearchResultClick(el);
            });

            el.addEventListener('mouseenter', (e) => {
                selectedIndex = parseInt(el.dataset.index);
                updateSelection();
            });
        });
    }

    /**
     * Update selected item visual state
     */
    function updateSelection() {
        resultsContainer.querySelectorAll('.search-result').forEach((el, index) => {
            el.classList.toggle('selected', index === selectedIndex);
            el.setAttribute('aria-selected', index === selectedIndex);
        });
        const active = resultsContainer.querySelector('.search-result.selected');
        if (active) {
            input.setAttribute('aria-activedescendant', active.id);
        } else {
            input.removeAttribute('aria-activedescendant');
        }

        // Scroll into view if needed
        const selected = resultsContainer.querySelector('.search-result.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Navigate to selected result
     */
    function navigateToResult(item) {
        trackSearch('search_result_click', {
            search_term: input.value.trim(),
            source: 'site_search',
            result_url: item.url,
            result_title: item.title,
            result_index: selectedIndex,
            result_rank: selectedIndex + 1,
            results_count: results.length
        });
        closeSearch();
        window.location.href = item.url;
    }

    /**
     * Highlight matched text
     */
    function highlightMatches(text, matches, key) {
        if (!matches) return escapeHtml(text);

        const match = matches.find(m => m.key === key);
        if (!match) return escapeHtml(text);

        // Sort indices in reverse to replace from end
        const indices = match.indices.slice().sort((a, b) => b[0] - a[0]);

        let result = text;
        indices.forEach(([start, end]) => {
            const before = result.slice(0, start);
            const matched = result.slice(start, end + 1);
            const after = result.slice(end + 1);
            result = before + `<mark class="search-highlight">${escapeHtml(matched)}</mark>` + after;
        });

        return result;
    }

    /**
     * Escape HTML special characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Toggle clear button visibility
     */
    function toggleClearButton() {
        if (input.value.trim().length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }
    }

    /**
     * Prioritize exact title matches
     */
    function prioritizeExactTitle(query, resultList) {
        const q = query.toLowerCase();
        const exact = [];
        const rest = [];
        resultList.forEach(res => {
            const title = (res.item.title || '').toLowerCase();
            if (title === q || title.includes(q)) {
                exact.push(res);
            } else {
                rest.push(res);
            }
        });
        return exact.concat(rest);
    }

    /**
     * Trap focus inside modal
     */
    function trapFocus(e) {
        const focusable = Array.from(modal.querySelectorAll('button, input, a, [tabindex]:not([tabindex=\"-1\"])'))
            .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function trackSearch(type, payload) {
        if (!window.analytics || typeof window.analytics.trackSearch !== 'function') return;
        window.analytics.trackSearch(type, payload);
    }

    function trackSearchQuery(query, count) {
        if (!query || query === lastTrackedQuery) return;
        lastTrackedQuery = query;
        trackSearch('search_query', {
            search_term: query,
            results_count: count
        });
    }

    function trackSearchResultClick(el) {
        const term = input.value.trim();
        const index = parseInt(el.dataset.index || '0', 10);
        const rank = index + 1;
        trackSearch('search_result_click', {
            search_term: term,
            source: 'site_search',
            result_index: index,
            result_url: el.dataset.url || '',
            result_title: el.dataset.title || '',
            result_rank: rank,
            results_count: results.length
        });
    }

    function buildTOC() {
        if (document.querySelector('.toc')) return;
        const article = document.querySelector('article.guide, article.guide-content');
        if (!article) return;

        const header = article.querySelector('.guide-header');
        if (!header) return;

        const contentRoot = article;
        const headings = Array.from(contentRoot.querySelectorAll('h2'))
            .filter((heading) => !heading.closest('.faq-section') && !heading.closest('.related-guides'));

        if (headings.length < 3) {
            const emptyPlaceholder = header.parentElement && header.parentElement.querySelector('.toc-placeholder');
            if (emptyPlaceholder) {
                emptyPlaceholder.remove();
            }
            return;
        }

        const usedIds = new Set();
        const items = headings.map((heading) => {
            let id = heading.getAttribute('id');
            if (!id) {
                id = heading.textContent.trim().toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
            let uniqueId = id || 'section';
            let counter = 2;
            while (usedIds.has(uniqueId)) {
                uniqueId = `${id}-${counter}`;
                counter += 1;
            }
            usedIds.add(uniqueId);
            heading.setAttribute('id', uniqueId);
            return { id: uniqueId, text: heading.textContent.trim(), level: heading.tagName.toLowerCase() };
        });

        if (items.length === 0) {
            const emptyPlaceholder = header.parentElement && header.parentElement.querySelector('.toc-placeholder');
            if (emptyPlaceholder) {
                emptyPlaceholder.remove();
            }
            return;
        }

        const toc = document.createElement('nav');
        toc.className = 'toc';
        toc.setAttribute('aria-label', 'On this page');

        const title = document.createElement('div');
        title.className = 'toc-title';
        title.textContent = 'On this page';
        toc.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'toc-list';

        items.forEach((item) => {
            const li = document.createElement('li');
            li.className = item.level === 'h3' ? 'toc-item toc-item--nested' : 'toc-item';
            const link = document.createElement('a');
            link.href = `#${item.id}`;
            link.textContent = item.text;
            li.appendChild(link);
            list.appendChild(li);
        });

        toc.appendChild(list);

        const placeholder = header.parentElement && header.parentElement.querySelector('.toc-placeholder');
        if (placeholder) {
            placeholder.classList.add('toc-placeholder--filled');
            placeholder.appendChild(toc);
        } else {
            header.insertAdjacentElement('afterend', toc);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
