/**
 * Lightweight GA4 event tracking helpers.
 * Uses gtag when available and no-ops otherwise.
 */
(function() {
    'use strict';

    const MEASUREMENT_ID = 'G-PYBSRQ1QFP';
    const tableDepthMarks = new Map();

    function canTrack() {
        return typeof window.gtag === 'function';
    }

    function track(eventName, params) {
        if (!canTrack()) return;
        window.gtag('event', eventName, Object.assign({
            measurement_id: MEASUREMENT_ID
        }, params || {}));
    }

    function getPath() {
        return window.location.pathname.replace(/^\//, '') || 'index.html';
    }

    function slugFromUrl(url) {
        if (!url) return '';
        return url.replace(/^\//, '').replace(/\.html$/, '');
    }

    function getOrCreateClickerId() {
        const key = 'lastz_ldshop_clicker_id';
        try {
            if (!window.localStorage) return '';
            const existing = window.localStorage.getItem(key);
            if (existing) return existing;
            const id = (window.crypto && window.crypto.randomUUID)
                ? window.crypto.randomUUID()
                : 'ldshop-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
            window.localStorage.setItem(key, id);
            return id;
        } catch (err) {
            return '';
        }
    }

    function getReferrerHost() {
        try {
            return document.referrer ? new URL(document.referrer).hostname.toLowerCase() : '';
        } catch (err) {
            return '';
        }
    }

    function resolveLLMSource() {
        const params = new URLSearchParams(window.location.search);
        const utmSource = (params.get('utm_source') || '').toLowerCase();
        if (utmSource === 'chatgpt.com') {
            return {
                source: 'chatgpt',
                sourceType: 'utm',
                channel: 'llm',
                referrerHost: getReferrerHost()
            };
        }

        const referrerHost = getReferrerHost();
        const sourceMap = [
            { match: 'chatgpt.com', source: 'chatgpt', channel: 'llm' },
            { match: 'perplexity.ai', source: 'perplexity', channel: 'llm' },
            { match: 'copilot.microsoft.com', source: 'copilot', channel: 'llm' },
            { match: 'bing.com', source: 'bing', channel: 'search_surface' },
            { match: 'grok.com', source: 'grok', channel: 'llm' },
            { match: 'x.com', source: 'x', channel: 'search_surface' }
        ];

        const hit = sourceMap.find((entry) => referrerHost === entry.match || referrerHost.endsWith('.' + entry.match));
        if (!hit) return null;
        return {
            source: hit.source,
            sourceType: 'referrer',
            channel: hit.channel,
            referrerHost
        };
    }

    function trackLLMReferralSession() {
        const detected = resolveLLMSource();
        if (!detected) return;

        const storageKey = 'lastz_llm_referral_logged';
        try {
            if (window.sessionStorage && window.sessionStorage.getItem(storageKey)) {
                return;
            }
        } catch (err) {
            // Ignore storage failures and still try to track once.
        }

        track('llm_referral_session', {
            llm_source: detected.source,
            llm_source_type: detected.sourceType,
            llm_channel: detected.channel,
            referrer_host: detected.referrerHost || '',
            landing_page: getPath(),
            guide_slug: slugFromUrl(getPath()),
            page_type: getPath() === 'index.html' ? 'home' : 'guide'
        });

        try {
            if (window.sessionStorage) {
                window.sessionStorage.setItem(storageKey, '1');
            }
        } catch (err) {
            // Ignore storage failures.
        }
    }

    function attachHomeTracking() {
        const homeNav = document.querySelector('.home-nav');
        if (homeNav) {
            homeNav.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;
                const groupId = link.getAttribute('href').slice(1);
                track('nav_group_click', {
                    group_id: groupId,
                    group_label: link.textContent.trim(),
                    page_type: 'home',
                    guide_slug: slugFromUrl(getPath())
                });
            });
        }

        const cards = document.querySelectorAll('.home .card');
        if (cards.length > 0) {
            cards.forEach((card) => {
                card.addEventListener('click', () => {
                    const group = card.closest('.home-group');
                    const sectionId = group ? group.id : 'ungrouped';
                    const titleEl = card.querySelector('h2');
                    track('card_click', {
                        card_url: card.getAttribute('href') || '',
                        card_title: titleEl ? titleEl.textContent.trim() : '',
                        card_section: sectionId,
                        page_type: 'home',
                        guide_slug: slugFromUrl(getPath())
                    });
                });
            });
        }
    }

    function attachGuideTracking() {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach((item, index) => {
            const question = item.querySelector('h3');
            if (!question) return;
            question.addEventListener('click', () => {
                track('faq_expand', {
                    faq_question: question.textContent.trim(),
                    faq_index: index + 1,
                    page_type: 'guide',
                    guide_slug: slugFromUrl(getPath())
                });
            });
        });

        const relatedLinks = document.querySelectorAll('.related-grid a, .related-card');
        relatedLinks.forEach((link) => {
            link.addEventListener('click', () => {
                track('related_click', {
                    from_page: slugFromUrl(getPath()),
                    to_page: slugFromUrl(link.getAttribute('href') || ''),
                    to_title: link.textContent.trim(),
                    page_type: 'guide',
                    guide_slug: slugFromUrl(getPath())
                });
            });
        });
    }

    function ldshopPromoParams(link) {
        const path = getPath();
        return {
            partner: 'ldshop',
            placement_id: link.getAttribute('data-placement-id') || 'ldshop-promo',
            page_path: window.location.pathname || '/',
            page_type: path === 'index.html' ? 'home' : 'guide',
            guide_slug: slugFromUrl(path)
        };
    }

    function giftCenterTrackingParams(link) {
        const path = getPath();
        const destination = link.href || '';
        const nearestSection = link.closest('section') || link.closest('article') || null;
        const placementId = link.getAttribute('data-placement-id') || 'gift-center-link';
        const sectionName = link.closest('[class]') ? link.closest('[class]').className : '';
        return {
            page_path: window.location.pathname || '/',
            page_type: path === 'index.html' ? 'home' : 'guide',
            guide_slug: slugFromUrl(path),
            placement_id: sectionName ? 'gc-' + sanitizeClassList(sectionName) : placementId,
            destination_url: destination,
            source: 'gift_center',
            gift_center_path: '/giftCenter/#/login',
            source_section: nearestSection ? nearestSection.id || nearestSection.className.split(' ')[0] : ''
        };
    }

    function sanitizeClassList(className) {
        return String(className || '')
            .split(/\s+/)[0] || 'gift-center-link';
    }

    function isGiftCenterLink(link) {
        if (!link) return false;
        const href = link.getAttribute('href') || '';
        try {
            const url = new URL(href, window.location.href);
            return url.hostname === 'last-z.com' && url.pathname.indexOf('/giftCenter') !== -1;
        } catch (err) {
            return href.indexOf('last-z.com/giftCenter') !== -1 || href.indexOf('/giftCenter/#/login') !== -1;
        }
    }

    function attachLdshopPromoTracking() {
        const promoLinks = document.querySelectorAll('[data-ldshop-placement]');
        if (promoLinks.length > 0 && 'IntersectionObserver' in window) {
            const seen = new WeakSet();
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || seen.has(entry.target)) {
                        return;
                    }
                    seen.add(entry.target);
                    track('ldshop_promo_view', ldshopPromoParams(entry.target));
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.5 });
            promoLinks.forEach((link) => observer.observe(link));
        }

        document.addEventListener('click', (event) => {
            const link = event.target.closest('[data-ldshop-placement]');
            if (!link) return;
            track('ldshop_promo_click', Object.assign(ldshopPromoParams(link), {
                destination_url: link.href,
                ldshop_clicker_id: getOrCreateClickerId()
            }));
        });
    }

    function attachGiftCenterTracking() {
        const links = document.querySelectorAll('a[href*="last-z.com/giftCenter"], a[href*="/giftCenter/#/login"]');
        links.forEach((link) => {
            link.addEventListener('click', () => {
                if (!isGiftCenterLink(link)) {
                    return;
                }
                track('gift_center_click', giftCenterTrackingParams(link));
            });
        });
    }

    function tableIdFor(el) {
        const explicit = el.getAttribute('data-table-id');
        if (explicit) return explicit;
        const path = getPath();
        if (path.includes('vehicle-modification-cost')) return 'vehicle-cost';
        if (path.includes('hq-construction-cost')) return 'hq-cost';
        return slugFromUrl(path) || 'table';
    }

    function attachTableTracking() {
        const scrollAreas = document.querySelectorAll('.table-scroll');
        scrollAreas.forEach((area) => {
            const tableId = tableIdFor(area);
            let interacted = false;

            function markInteraction(type) {
                if (interacted) return;
                interacted = true;
                track('table_interaction', {
                    table_id: tableId,
                    interaction_type: type,
                    guide_slug: slugFromUrl(getPath()),
                    page_type: 'table'
                });
            }

            area.addEventListener('scroll', () => {
                markInteraction('scroll');
                trackTableDepth(area, tableId);
            }, { passive: true });
            area.addEventListener('wheel', () => markInteraction('wheel'), { passive: true });
            area.addEventListener('touchstart', () => markInteraction('touch'), { passive: true });

            const legend = area.closest('.data-table-card')?.querySelector('.table-legend');
            if (legend && 'IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            track('table_legend_view', {
                                table_id: tableId,
                                guide_slug: slugFromUrl(getPath()),
                                page_type: 'table'
                            });
                            observer.disconnect();
                        }
                    });
                }, { rootMargin: '0px 0px -40% 0px' });
                observer.observe(legend);
            }
        });
    }

    function trackTableDepth(area, tableId) {
        const maxScroll = area.scrollHeight - area.clientHeight;
        if (maxScroll <= 0) return;
        const pct = Math.min(100, Math.round((area.scrollTop / maxScroll) * 100));
        const marks = tableDepthMarks.get(area) || new Set();
        [25, 50, 75, 100].forEach((mark) => {
            if (pct >= mark && !marks.has(mark)) {
                marks.add(mark);
                track('table_scroll_depth', {
                    table_id: tableId,
                    depth_pct: mark,
                    guide_slug: slugFromUrl(getPath()),
                    page_type: 'table'
                });
            }
        });
        tableDepthMarks.set(area, marks);
    }

    // Expose a small API for search.js to call.
    window.analytics = window.analytics || {};
    window.analytics.trackEvent = track;
    window.analytics.trackSearch = function(type, payload) {
        track(type, Object.assign({
            guide_slug: slugFromUrl(getPath()),
            page_type: getPath() === 'index.html' ? 'home' : 'guide'
        }, payload || {}));
    };

    function init() {
        trackLLMReferralSession();
        attachHomeTracking();
        attachGuideTracking();
        attachLdshopPromoTracking();
        attachGiftCenterTracking();
        attachTableTracking();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
