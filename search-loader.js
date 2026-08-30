(function() {
    'use strict';

    var loaded = false;
    var loading = false;
    var pendingOpen = false;
    var freshCodesSeenKey = 'lastz.freshCodesSeen';
    var luckyRoseStatusUrl = 'https://lastz-lucky-rose.o-smolerov.workers.dev/lucky-rose-status.json';
    var luckyRoseStatusPromise = null;
    var luckyRoseExpiryTimer = null;
    var luckyRoseCurrentStatus = null;
    var luckyRoseLink = null;

    function luckyRoseIcon() {
        return '<img class="lucky-rose-nav__icon" src="/assets/items/yellow-rose.png" alt="" aria-hidden="true">';
    }

    function isConfirmedLuckyRoseStatus(status) {
        if (!status || status.status !== 'confirmed') return false;
        if (!Number.isInteger(status.number) || status.number < 1 || status.number > 10) return false;
        if (!status.buff || !status.buff.label || !status.buff.duration || !status.valid_until) return false;
        var validUntil = Date.parse(status.valid_until);
        return Number.isFinite(validUntil) && validUntil > Date.now();
    }

    function getLuckyRoseStatus() {
        if (luckyRoseStatusPromise) return luckyRoseStatusPromise;
        if (!window.fetch) return Promise.resolve(null);
        luckyRoseStatusPromise = window.fetch(luckyRoseStatusUrl, { credentials: 'omit' })
            .then(function(response) {
                if (!response.ok) throw new Error('Lucky Rose status unavailable');
                return response.json();
            })
            .catch(function() { return null; });
        window.lastzLuckyRoseStatusPromise = luckyRoseStatusPromise;
        window.lastzLuckyRoseStatusUrl = luckyRoseStatusUrl;
        return luckyRoseStatusPromise;
    }

    function renderLuckyRosePending() {
        if (!luckyRoseLink) return;
        if (luckyRoseExpiryTimer) window.clearTimeout(luckyRoseExpiryTimer);
        luckyRoseExpiryTimer = null;
        luckyRoseCurrentStatus = null;
        luckyRoseLink.querySelector('.lucky-rose-nav__number').textContent = '?';
        luckyRoseLink.querySelector('.lucky-rose-nav__label').textContent = '';
        luckyRoseLink.setAttribute('aria-label', 'Lucky Rose this week: checking');
    }

    function scheduleLuckyRoseExpiry(status) {
        if (luckyRoseExpiryTimer) window.clearTimeout(luckyRoseExpiryTimer);
        var delay = Date.parse(status.valid_until) - Date.now();
        if (delay <= 0) {
            renderLuckyRosePending();
            return;
        }
        luckyRoseExpiryTimer = window.setTimeout(renderLuckyRosePending, delay);
    }

    function enhanceLuckyRoseNavigation() {
        var language = (document.documentElement.lang || 'en').toLowerCase().split('-', 1)[0];
        if (language !== 'en') return;
        var header = document.querySelector('.site-header');
        var search = header && header.querySelector('.search-trigger');
        if (!header || !search || header.querySelector('.lucky-rose-nav')) return;

        var link = document.createElement('a');
        link.className = 'lucky-rose-nav';
        link.href = '/lucky-rose.html';
        link.setAttribute('aria-label', 'Lucky Rose this week: checking');
        link.innerHTML = luckyRoseIcon() +
            '<span class="lucky-rose-nav__number">?</span>' +
            '<span class="lucky-rose-nav__label"></span>';
        if (/\/lucky-rose\.html$/.test(window.location.pathname)) link.classList.add('is-active');
        header.classList.add('site-header--has-lucky-rose');
        header.insertBefore(link, search);
        luckyRoseLink = link;

        getLuckyRoseStatus().then(function(status) {
            if (!isConfirmedLuckyRoseStatus(status)) {
                renderLuckyRosePending();
                return;
            }
            luckyRoseCurrentStatus = status;
            link.querySelector('.lucky-rose-nav__number').textContent = status.number;
            link.querySelector('.lucky-rose-nav__label').textContent = 'Roses';
            link.setAttribute('aria-label', 'Lucky Rose this week: ' + status.number + ' Yellow Roses');
            scheduleLuckyRoseExpiry(status);
        });
    }

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && luckyRoseCurrentStatus && !isConfirmedLuckyRoseStatus(luckyRoseCurrentStatus)) {
            renderLuckyRosePending();
        }
    });

    function isCodesPath(pathname) {
        return /\/(?:fr\/|es\/)?codes\.html$/.test(pathname);
    }

    function freshCodeLabel(count) {
        var language = (document.documentElement.lang || 'en').toLowerCase().split('-', 1)[0];
        if (language === 'fr') {
            return count === 1 ? '1 nouveau code disponible' : count + ' nouveaux codes disponibles';
        }
        if (language === 'es') {
            return count === 1 ? '1 código nuevo disponible' : count + ' códigos nuevos disponibles';
        }
        return count === 1 ? '1 new code available' : count + ' new codes available';
    }

    function readSeenFreshCodes() {
        try {
            return window.localStorage ? window.localStorage.getItem(freshCodesSeenKey) : null;
        } catch (error) {
            return null;
        }
    }

    function rememberFreshCodes(freshId) {
        try {
            if (window.localStorage) window.localStorage.setItem(freshCodesSeenKey, freshId);
        } catch (error) {
            // Storage is optional; the navigation remains usable without it.
        }
    }

    function isFreshStatus(status) {
        if (!status || status.fresh !== true || !status.fresh_id || !status.fresh_until) return false;
        if (!Number.isInteger(status.fresh_count) || status.fresh_count < 1) return false;
        var freshUntil = Date.parse(status.fresh_until);
        return Number.isFinite(freshUntil) && freshUntil > Date.now();
    }

    function enhanceFreshCodeNavigation() {
        if (!window.fetch) return;
        window.fetch('/codes-status.json', { cache: 'no-cache', credentials: 'same-origin' })
            .then(function(response) {
                if (!response.ok) throw new Error('Fresh code status unavailable');
                return response.json();
            })
            .then(function(status) {
                if (!isFreshStatus(status)) return;
                if (isCodesPath(window.location.pathname)) {
                    rememberFreshCodes(status.fresh_id);
                    return;
                }
                if (readSeenFreshCodes() === status.fresh_id) return;

                var label = freshCodeLabel(status.fresh_count);
                var links = document.querySelectorAll('.site-primary-nav a, .mobile-bottom-nav a');
                Array.prototype.forEach.call(links, function(link) {
                    var target = new URL(link.href, window.location.href);
                    if (!isCodesPath(target.pathname)) return;
                    var linkLabel = link.textContent.trim();
                    var badge = document.createElement('span');
                    badge.className = 'fresh-code-nav-badge';
                    badge.setAttribute('aria-hidden', 'true');
                    badge.textContent = '+' + status.fresh_count;
                    link.classList.add('has-fresh-code');
                    link.appendChild(badge);
                    link.setAttribute('aria-label', linkLabel + ' — ' + label);
                });
            })
            .catch(function() {
                // A missing status must never block navigation or search.
            });
    }

    function buildTOC() {
        if (document.querySelector('.toc')) return;
        var article = document.querySelector('article.guide, article.guide-content');
        if (!article) return;
        var header = article.querySelector('.guide-header');
        if (!header) return;

        var contentRoot = article;
        var headings = Array.prototype.slice.call(contentRoot.querySelectorAll('h2'))
            .filter(function(heading) {
                var text = heading.textContent.trim().toLowerCase();
                var isQuickAnswerHeading = text === 'quick answer' || text === 'réponse rapide' || text === 'respuesta rápida';
                return !isQuickAnswerHeading && !heading.closest('.faq-section') && !heading.closest('.related-guides');
            });

        if (headings.length < 3) {
            var emptyPlaceholder = header.parentElement && header.parentElement.querySelector('.toc-placeholder');
            if (emptyPlaceholder) emptyPlaceholder.remove();
            return;
        }

        var usedIds = new Set();
        var items = headings.map(function(heading) {
            var id = heading.getAttribute('id');
            if (!id) {
                id = heading.textContent.trim().toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
            var uniqueId = id || 'section';
            var counter = 2;
            while (usedIds.has(uniqueId)) {
                uniqueId = id + '-' + counter;
                counter += 1;
            }
            usedIds.add(uniqueId);
            heading.setAttribute('id', uniqueId);
            return { id: uniqueId, text: heading.textContent.trim(), level: heading.tagName.toLowerCase() };
        });

        if (!items.length) {
            var placeholder = header.parentElement && header.parentElement.querySelector('.toc-placeholder');
            if (placeholder) placeholder.remove();
            return;
        }

        var toc = document.createElement('nav');
        toc.className = 'toc';
        toc.setAttribute('aria-label', 'On this page');

        var title = document.createElement('div');
        title.className = 'toc-title';
        title.textContent = 'On this page';
        toc.appendChild(title);

        var list = document.createElement('ul');
        list.className = 'toc-list';

        items.forEach(function(item) {
            var li = document.createElement('li');
            li.className = item.level === 'h3' ? 'toc-item toc-item--nested' : 'toc-item';
            var link = document.createElement('a');
            link.href = '#' + item.id;
            link.textContent = item.text;
            li.appendChild(link);
            list.appendChild(li);
        });

        toc.appendChild(list);
        var container = header.parentElement && header.parentElement.querySelector('.toc-placeholder');
        if (container) {
            container.classList.add('toc-placeholder--filled');
            container.appendChild(toc);
        } else {
            header.insertAdjacentElement('afterend', toc);
        }
    }

    function enhanceComparisonTables() {
        var tables = Array.prototype.slice.call(document.querySelectorAll('.comparison-table'));
        tables.forEach(function(table) {
            if (table.classList.contains('comparison-table--stacked-ready')) return;

            var headers = Array.prototype.slice.call(table.querySelectorAll('thead th'))
                .map(function(header) {
                    return header.textContent.trim();
                });
            if (!headers.length) return;

            Array.prototype.slice.call(table.querySelectorAll('tbody tr')).forEach(function(row) {
                Array.prototype.slice.call(row.children).forEach(function(cell, index) {
                    if (headers[index] && !cell.hasAttribute('data-label')) {
                        cell.setAttribute('data-label', headers[index]);
                    }
                });
            });

            table.classList.add('comparison-table--stacked-ready');
        });
    }

    function centerActiveClusterNavItem() {
        var navs = Array.prototype.slice.call(document.querySelectorAll('.home-nav'));
        navs.forEach(function(nav) {
            var active = nav.querySelector('.is-active');
            if (!active || nav.scrollWidth <= nav.clientWidth) return;

            window.requestAnimationFrame(function() {
                var target = active.offsetLeft - ((nav.clientWidth - active.offsetWidth) / 2);
                nav.scrollTo({
                    left: Math.max(0, target),
                    behavior: 'auto'
                });
            });
        });
    }

    function loadSearch() {
        if (loaded || loading) return;
        loading = true;
        var script = document.createElement('script');
        script.src = '/search.js?v=20260523-toc2';
        script.defer = true;
        script.onload = function() {
            loaded = true;
            loading = false;
            if (pendingOpen) {
                var openNow = function() {
                    var trigger = document.querySelector('.search-trigger');
                    if (trigger) trigger.click();
                };
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', openNow, { once: true });
                } else {
                    openNow();
                }
            }
        };
        script.onerror = function() {
            loading = false;
        };
        document.head.appendChild(script);
    }

    function requestOpen() {
        pendingOpen = true;
        window.__openSearchOnLoad = true;
        loadSearch();
    }

    document.addEventListener('click', function(e) {
        var trigger = e.target.closest && e.target.closest('.search-trigger');
        if (!trigger) return;
        if (!loaded) {
            e.preventDefault();
            requestOpen();
        }
    }, true);

    document.addEventListener('keydown', function(e) {
        var isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
        var isSlash = e.key === '/' && !(document.activeElement && /input|textarea/i.test(document.activeElement.tagName));
        if (!isCmdK && !isSlash) return;
        if (!loaded) {
            e.preventDefault();
            requestOpen();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            buildTOC();
            enhanceComparisonTables();
            centerActiveClusterNavItem();
            enhanceFreshCodeNavigation();
            enhanceLuckyRoseNavigation();
        });
    } else {
        buildTOC();
        enhanceComparisonTables();
        centerActiveClusterNavItem();
        enhanceFreshCodeNavigation();
        enhanceLuckyRoseNavigation();
    }
})();
