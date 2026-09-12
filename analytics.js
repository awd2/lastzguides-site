/**
 * Lightweight GA4 event tracking helpers.
 * Uses gtag when available and no-ops otherwise.
 */
(function() {
    'use strict';

    const MEASUREMENT_ID = 'G-PYBSRQ1QFP';
    const LDSHOP_EXPERIMENT = {
        // Rollback: false restores existing static HTML; never reactivates the old test.
        enabled: true,
        id: 'ldshop_offers_v1',
        storageKey: 'lastz_ldshop_offers_v1',
        catalogKey: 'lastz_ldshop_offers_v1_catalog',
        catalogUrl: '/assets/ldshop/offers.json'
    };
    // BEGIN GENERATED LDSHOP STARTUP CATALOG
    const LDSHOP_STARTUP_CATALOG = {"schema_version":1,"language":"en","currency":"USD","checked_at":"2026-09-12T15:11:31.967653Z","catalog_version":"12fa80bb3e68eb4e","primary":{"offer_id":"12202","ends_at":null,"html":"\u003ca class=\"ldshop-promo ldshop-promo--offer\" href=\"https://chain.ldshop.gg/T4VTmA3oZ\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-ldshop-placement=\"top-banner\" data-placement-id=\"ldshop-top-banner\">\u003cspan class=\"ldshop-promo__copy\">\u003cspan class=\"ldshop-promo__title\">$19.99 pack for $15.28\u003c/span>\u003cspan class=\"ldshop-promo__text\">Save $4.71 on your Last Z pack at LDShop.\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__details\">\u003cspan class=\"ldshop-promo__deal\">23% OFF\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__side\">\n            \u003cpicture class=\"ldshop-promo__logo\">\n                \u003csource media=\"(max-width: 640px)\" srcset=\"/assets/ldshop/ldshop-logo-vertical.png\">\n                \u003cimg src=\"/assets/ldshop/ldshop-logo-wide.png\" alt=\"LDShop\" width=\"510\" height=\"153\" loading=\"lazy\" decoding=\"async\">\n            \u003c/picture>\n            \u003cspan class=\"ldshop-promo__cta\">Top Up Now\u003c/span>\n        \u003c/span>\u003c/a>"},"offers":[{"offer_id":"16112","ends_at":null,"html":"\u003ca class=\"ldshop-promo ldshop-promo--offer\" href=\"https://chain.ldshop.gg/T4VTmA3oZ\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-ldshop-placement=\"top-banner\" data-placement-id=\"ldshop-top-banner\">\u003cspan class=\"ldshop-promo__copy\">\u003cspan class=\"ldshop-promo__title\">500 Gold Bars for $2.99\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__details\">\u003cspan class=\"ldshop-promo__deal\">40% OFF\u003c/span>\u003cspan class=\"ldshop-promo__terms\">New LDShop customers only. One New User Discount item only.\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__side\">\n            \u003cpicture class=\"ldshop-promo__logo\">\n                \u003csource media=\"(max-width: 640px)\" srcset=\"/assets/ldshop/ldshop-logo-vertical.png\">\n                \u003cimg src=\"/assets/ldshop/ldshop-logo-wide.png\" alt=\"LDShop\" width=\"510\" height=\"153\" loading=\"lazy\" decoding=\"async\">\n            \u003c/picture>\n            \u003cspan class=\"ldshop-promo__cta\">Top Up Now\u003c/span>\n        \u003c/span>\u003c/a>"},{"offer_id":"15682","ends_at":null,"html":"\u003ca class=\"ldshop-promo ldshop-promo--offer\" href=\"https://chain.ldshop.gg/T4VTmA3oZ\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-ldshop-placement=\"top-banner\" data-placement-id=\"ldshop-top-banner\">\u003cspan class=\"ldshop-promo__copy\">\u003cspan class=\"ldshop-promo__title\">1,000 Gold Bars for $7.64\u003c/span>\u003cspan class=\"ldshop-promo__text\">Save $2.35 on LDShop.\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__details\">\u003cspan class=\"ldshop-promo__deal\">23% OFF\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__side\">\n            \u003cpicture class=\"ldshop-promo__logo\">\n                \u003csource media=\"(max-width: 640px)\" srcset=\"/assets/ldshop/ldshop-logo-vertical.png\">\n                \u003cimg src=\"/assets/ldshop/ldshop-logo-wide.png\" alt=\"LDShop\" width=\"510\" height=\"153\" loading=\"lazy\" decoding=\"async\">\n            \u003c/picture>\n            \u003cspan class=\"ldshop-promo__cta\">Top Up Now\u003c/span>\n        \u003c/span>\u003c/a>"},{"offer_id":"12202","ends_at":null,"html":"\u003ca class=\"ldshop-promo ldshop-promo--offer\" href=\"https://chain.ldshop.gg/T4VTmA3oZ\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-ldshop-placement=\"top-banner\" data-placement-id=\"ldshop-top-banner\">\u003cspan class=\"ldshop-promo__copy\">\u003cspan class=\"ldshop-promo__title\">$19.99 pack for $15.28\u003c/span>\u003cspan class=\"ldshop-promo__text\">Save $4.71 on your Last Z pack at LDShop.\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__details\">\u003cspan class=\"ldshop-promo__deal\">23% OFF\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__side\">\n            \u003cpicture class=\"ldshop-promo__logo\">\n                \u003csource media=\"(max-width: 640px)\" srcset=\"/assets/ldshop/ldshop-logo-vertical.png\">\n                \u003cimg src=\"/assets/ldshop/ldshop-logo-wide.png\" alt=\"LDShop\" width=\"510\" height=\"153\" loading=\"lazy\" decoding=\"async\">\n            \u003c/picture>\n            \u003cspan class=\"ldshop-promo__cta\">Top Up Now\u003c/span>\n        \u003c/span>\u003c/a>"},{"offer_id":"14281","ends_at":null,"html":"\u003ca class=\"ldshop-promo ldshop-promo--offer\" href=\"https://chain.ldshop.gg/T4VTmA3oZ\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-ldshop-placement=\"top-banner\" data-placement-id=\"ldshop-top-banner\">\u003cspan class=\"ldshop-promo__copy\">\u003cspan class=\"ldshop-promo__title\">ApocaAid Monthly Pass for $19.10\u003c/span>\u003cspan class=\"ldshop-promo__text\">Save $5.89 on LDShop.\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__details\">\u003cspan class=\"ldshop-promo__deal\">23% OFF\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__side\">\n            \u003cpicture class=\"ldshop-promo__logo\">\n                \u003csource media=\"(max-width: 640px)\" srcset=\"/assets/ldshop/ldshop-logo-vertical.png\">\n                \u003cimg src=\"/assets/ldshop/ldshop-logo-wide.png\" alt=\"LDShop\" width=\"510\" height=\"153\" loading=\"lazy\" decoding=\"async\">\n            \u003c/picture>\n            \u003cspan class=\"ldshop-promo__cta\">Top Up Now\u003c/span>\n        \u003c/span>\u003c/a>"},{"offer_id":"14461","ends_at":null,"html":"\u003ca class=\"ldshop-promo ldshop-promo--offer\" href=\"https://chain.ldshop.gg/T4VTmA3oZ\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-ldshop-placement=\"top-banner\" data-placement-id=\"ldshop-top-banner\">\u003cspan class=\"ldshop-promo__copy\">\u003cspan class=\"ldshop-promo__title\">Season Journey for $19.10\u003c/span>\u003cspan class=\"ldshop-promo__text\">Save $5.89 on LDShop.\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__details\">\u003cspan class=\"ldshop-promo__deal\">23% OFF\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__side\">\n            \u003cpicture class=\"ldshop-promo__logo\">\n                \u003csource media=\"(max-width: 640px)\" srcset=\"/assets/ldshop/ldshop-logo-vertical.png\">\n                \u003cimg src=\"/assets/ldshop/ldshop-logo-wide.png\" alt=\"LDShop\" width=\"510\" height=\"153\" loading=\"lazy\" decoding=\"async\">\n            \u003c/picture>\n            \u003cspan class=\"ldshop-promo__cta\">Top Up Now\u003c/span>\n        \u003c/span>\u003c/a>"},{"offer_id":"15686","ends_at":null,"html":"\u003ca class=\"ldshop-promo ldshop-promo--offer\" href=\"https://chain.ldshop.gg/T4VTmA3oZ\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-ldshop-placement=\"top-banner\" data-placement-id=\"ldshop-top-banner\">\u003cspan class=\"ldshop-promo__copy\">\u003cspan class=\"ldshop-promo__title\">Save $23.56 on 10,000 Gold Bars\u003c/span>\u003cspan class=\"ldshop-promo__text\">Pay just $76.43 on LDShop.\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__details\">\u003cspan class=\"ldshop-promo__deal\">23% OFF\u003c/span>\u003c/span>\u003cspan class=\"ldshop-promo__side\">\n            \u003cpicture class=\"ldshop-promo__logo\">\n                \u003csource media=\"(max-width: 640px)\" srcset=\"/assets/ldshop/ldshop-logo-vertical.png\">\n                \u003cimg src=\"/assets/ldshop/ldshop-logo-wide.png\" alt=\"LDShop\" width=\"510\" height=\"153\" loading=\"lazy\" decoding=\"async\">\n            \u003c/picture>\n            \u003cspan class=\"ldshop-promo__cta\">Top Up Now\u003c/span>\n        \u003c/span>\u003c/a>"}]};
    // END GENERATED LDSHOP STARTUP CATALOG
    function canTrack() {
        return typeof window.gtag === 'function'
            && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    }

    function isAnalyticsDebug() {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('analytics_debug') === '1'
                || (window.localStorage && window.localStorage.getItem('lastz.analyticsDebug') === '1');
        } catch (err) {
            return false;
        }
    }

    function recordAnalyticsDebug(eventName, params) {
        if (!isAnalyticsDebug()) return;
        window.__lastzAnalyticsEvents = window.__lastzAnalyticsEvents || [];
        window.__lastzAnalyticsEvents.push({
            event: eventName,
            params: Object.assign({}, params || {})
        });
    }

    function track(eventName, params) {
        const eventParams = Object.assign({
            measurement_id: MEASUREMENT_ID
        }, params || {});
        recordAnalyticsDebug(eventName, eventParams);
        if (!canTrack()) return;
        window.gtag('event', eventName, eventParams);
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

    function normalizedPageFromUrl(value) {
        try {
            const url = new URL(value, window.location.href);
            let path = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
            return path || 'index';
        } catch (err) {
            return '';
        }
    }

    function attachNavigationTracking() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest('.site-primary-nav a, .mobile-bottom-nav a');
            if (!link) return;

            let destination;
            try {
                destination = new URL(link.getAttribute('href') || '', window.location.href);
            } catch (err) {
                return;
            }
            if (destination.origin !== window.location.origin) return;
            if (destination.hash
                && normalizedPageFromUrl(destination.href) === normalizedPageFromUrl(window.location.href)) {
                return;
            }

            const toPage = normalizedPageFromUrl(destination.href);
            if (!toPage) return;
            const path = getPath();
            track('nav_click', {
                interaction_source: link.closest('.mobile-bottom-nav')
                    ? 'mobile_bottom_nav'
                    : 'primary_nav',
                from_page: normalizedPageFromUrl(window.location.href),
                to_page: toPage,
                guide_slug: slugFromUrl(path),
                page_type: path === 'index.html' ? 'home' : 'guide'
            });
        });
    }

    function attachGuideTracking() {
        const nextJobLinks = document.querySelectorAll('a[data-next-job-id][data-from-job-id]');
        nextJobLinks.forEach((link) => {
            link.addEventListener('click', () => {
                track('next_job_click', {
                    next_job_id: link.getAttribute('data-next-job-id') || '',
                    from_job_id: link.getAttribute('data-from-job-id') || '',
                    from_page: slugFromUrl(getPath()),
                    to_page: slugFromUrl(link.getAttribute('href') || ''),
                    to_title: link.textContent.trim(),
                    interaction_source: 'contextual_next_job',
                    page_type: 'guide',
                    guide_slug: slugFromUrl(getPath())
                });
            });
        });

        const allianceDuelDayLinks = document.querySelectorAll('[data-duel-day]');
        allianceDuelDayLinks.forEach((link) => {
            link.addEventListener('click', () => {
                track('alliance_duel_day_click', {
                    duel_day: link.getAttribute('data-duel-day') || '',
                    interaction_source: 'quick_answer',
                    page_type: 'guide',
                    guide_slug: slugFromUrl(getPath())
                });
            });
        });

        const relatedLinks = document.querySelectorAll('.related-grid a, .related-card');
        relatedLinks.forEach((link) => {
            link.addEventListener('click', () => {
                if (link.hasAttribute('data-next-job-id')) return;
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

    function isEnglishPage() {
        return (document.documentElement.lang || '').toLowerCase().split('-', 1)[0] === 'en';
    }

    function readLdshopOfferState(create = false) {
        try {
            const raw = window.localStorage.getItem(LDSHOP_EXPERIMENT.storageKey);
            if (raw !== null) {
                const state = JSON.parse(raw);
                return state && ['control', 'rotation'].includes(state.group)
                    && Number.isFinite(state.assigned_at) && Number.isInteger(state.offer_exposures)
                    && state.offer_exposures >= 0
                    && Array.isArray(state.order) && state.order.every(id => typeof id === 'string')
                    && Array.isArray(state.shown) && state.shown.every(id => typeof id === 'string')
                    && (state.last_offer === null || typeof state.last_offer === 'string') ? state : null;
            }
            if (!create) return null;
            const state = {group: Math.random() < 0.5 ? 'control' : 'rotation', assigned_at: Date.now(),
                offer_exposures: 0, order: [], shown: [], last_offer: null};
            return saveLdshopOfferState(state) ? state : null;
        } catch (err) { return null; }
    }

    function saveLdshopOfferState(state) {
        try {
            window.localStorage.setItem(LDSHOP_EXPERIMENT.storageKey, JSON.stringify(state));
            return true;
        } catch (err) { return false; }
    }

    function shuffleLdshopOffers(ids) {
        const result = ids.slice();
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function validLdshopCatalog(data) {
        return data && data.schema_version === 1 && data.language === 'en' && data.currency === 'USD'
            && Number.isFinite(Date.parse(data.checked_at)) && typeof data.catalog_version === 'string'
            && Array.isArray(data.offers) && data.offers.length <= 20
            && data.offers.every(offer => typeof offer.offer_id === 'string' && typeof offer.html === 'string'
                && (offer.ends_at === null || Number.isFinite(Date.parse(offer.ends_at))))
            && new Set(data.offers.map(offer => offer.offer_id)).size === data.offers.length
            && (data.primary === null || (typeof data.primary.offer_id === 'string'
                && typeof data.primary.html === 'string'
                && (data.primary.ends_at === null || Number.isFinite(Date.parse(data.primary.ends_at)))));
    }

    function readLdshopCatalog() {
        let cached = validLdshopCatalog(LDSHOP_STARTUP_CATALOG) ? LDSHOP_STARTUP_CATALOG : null;
        try {
            const data = JSON.parse(window.localStorage.getItem(LDSHOP_EXPERIMENT.catalogKey));
            if (validLdshopCatalog(data) && (!cached || Date.parse(data.checked_at) > Date.parse(cached.checked_at))) cached = data;
        } catch (err) { /* Fetch still works without a cache. */ }
        return cached;
    }

    async function loadLdshopCatalog() {
        const cached = readLdshopCatalog();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        try {
            const response = await fetch(LDSHOP_EXPERIMENT.catalogUrl, {cache: 'no-cache', signal: controller.signal});
            if (!response.ok) return cached;
            const data = await response.json();
            if (!validLdshopCatalog(data)) return cached;
            if (cached && Date.parse(cached.checked_at) > Date.parse(data.checked_at)) return cached;
            try { window.localStorage.setItem(LDSHOP_EXPERIMENT.catalogKey, JSON.stringify(data)); } catch (err) { /* Optional cache. */ }
            return data;
        } catch (err) { return cached; }
        finally { clearTimeout(timer); }
    }

    function selectLdshopOffer(state, catalog) {
        if (!state || state.group !== 'rotation' || !catalog) return null;
        // Snapshot age never expires prices. Only an explicit product end matters.
        const available = offer => !offer.ends_at || Date.now() < Date.parse(offer.ends_at);
        const offers = catalog.offers.filter(available);
        const ids = offers.map(offer => offer.offer_id);
        state.order = state.order.filter(id => ids.includes(id) && !state.shown.includes(id));
        state.order.push(...shuffleLdshopOffers(ids.filter(id => !state.order.includes(id) && !state.shown.includes(id))));
        if (!state.order.length) {
            state.shown = [];
            state.order = shuffleLdshopOffers(ids);
            if (state.order.length > 1 && state.order[0] === state.last_offer) state.order.push(state.order.shift());
        }
        const primary = state.offer_exposures === 0 && catalog.primary && available(catalog.primary) ? catalog.primary : null;
        if (!saveLdshopOfferState(state)) return null;
        return primary || offers.find(offer => offer.offer_id === state.order[0]) || null;
    }

    function renderLdshopOffer(link, offer) {
        if (offer) {
            const template = document.createElement('template');
            template.innerHTML = offer.html;
            const rendered = template.content.firstElementChild;
            if (!rendered || !rendered.matches('a.ldshop-promo--offer') || rendered.getAttribute('href') !== link.getAttribute('href')) return false;
            // Retain the original anchor, destination, attributes and event target.
            link.replaceChildren(...rendered.childNodes);
        } else {
            const copy = document.createElement('span');
            copy.className = 'ldshop-promo__copy';
            [['ldshop-promo__title', 'Top up Last Z for less'],
                ['ldshop-promo__text', 'Gold Bars, packs and passes at LDShop.']].forEach(([cls, text]) => {
                const node = document.createElement('span'); node.className = cls; node.textContent = text; copy.appendChild(node);
            });
            const details = document.createElement('span'); details.className = 'ldshop-promo__details';
            link.replaceChildren(copy, details, link.querySelector('.ldshop-promo__side'));
        }
        link.classList.add('ldshop-promo--offer');
        return true;
    }

    function ldshopPromoParams(link) {
        const path = getPath();
        return {partner: 'ldshop', placement_id: link.getAttribute('data-placement-id') || 'ldshop-promo',
            page_path: window.location.pathname || '/', page_type: path === 'index.html' ? 'home' : 'guide',
            guide_slug: slugFromUrl(path)};
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
            interaction_source: 'gift_center',
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

    async function attachLdshopPromoTracking() {
        const promoLinks = Array.from(document.querySelectorAll('[data-ldshop-placement]'));
        if (!promoLinks.length) return;
        const participating = LDSHOP_EXPERIMENT.enabled && isEnglishPage()
            && promoLinks.some(link => link.matches('.ldshop-promo'));
        const state = participating ? readLdshopOfferState(true) : null;
        const contexts = new Map(promoLinks.map(link => [link, {viewed: false, clicked: false, ratio: 0, ready: false,
            state: link.matches('.ldshop-promo') ? state : null, offer: null, replaced: false}]));
        // Choose once, synchronously. Network updates are for the next page load.
        const catalog = state && state.group === 'rotation' ? readLdshopCatalog() : null;
        function params(link, context) {
            return Object.assign(ldshopPromoParams(link), context.state && context.ready ? {
                experiment_id: LDSHOP_EXPERIMENT.id, experiment_group: context.state.group,
                creative_id: context.state.group === 'control' ? 'base_saving_21' : (context.offer ? context.offer.offer_id : 'fallback'),
                catalog_version: catalog ? catalog.catalog_version : 'unavailable'
            } : {});
        }
        function expire(link, context) {
            if (context.offer && context.offer.ends_at && Date.now() >= Date.parse(context.offer.ends_at)) {
                renderLdshopOffer(link, null);
                context.offer = null;
                context.replaced = context.viewed;
            }
        }
        function qualify(link, context) {
            if (!context.ready || context.viewed || context.ratio < 0.5 || document.visibilityState !== 'visible') return;
            expire(link, context);
            context.viewed = true;
            if (context.state && context.offer) {
                const latest = readLdshopOfferState();
                if (!latest || latest.group !== context.state.group || latest.assigned_at !== context.state.assigned_at) {
                    context.state = null;
                } else {
                    latest.offer_exposures++;
                    latest.last_offer = context.offer.offer_id;
                    latest.order = latest.order.filter(id => id !== context.offer.offer_id);
                    if (!latest.shown.includes(context.offer.offer_id)) latest.shown.push(context.offer.offer_id);
                    if (!saveLdshopOfferState(latest)) context.state = null;
                }
            }
            track('ldshop_promo_view', params(link, context));
        }
        document.addEventListener('click', event => {
            const link = event.target.closest('[data-ldshop-placement]');
            const context = contexts.get(link);
            if (!context) return;
            expire(link, context);
            const payload = Object.assign(params(link, context), {destination_url: link.href});
            track('ldshop_promo_click', Object.assign({}, payload, {ldshop_clicker_id: getOrCreateClickerId()}));
            if (context.state && context.viewed && !context.clicked && !context.replaced) {
                context.clicked = true;
                track('ldshop_offer_qualified_click', payload);
            }
        });
        contexts.forEach((context, link) => {
            if (context.state) {
                if (context.state.group === 'control') {
                    link.querySelector('.ldshop-promo__text').innerHTML =
                        'Get the same Last Z packs for <strong>up to 21% less</strong> than in-game.';
                } else {
                    context.offer = selectLdshopOffer(context.state, catalog);
                    if (!renderLdshopOffer(link, context.offer)) {
                        context.offer = null; renderLdshopOffer(link, null);
                    }
                }
                link.dataset.ldshopExperimentId = LDSHOP_EXPERIMENT.id;
                link.dataset.ldshopExperimentGroup = context.state.group;
                link.dataset.ldshopCreativeId = context.state.group === 'control' ? 'base_saving_21' : (context.offer ? context.offer.offer_id : 'fallback');
            }
            context.ready = true;
        });
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => entries.forEach(entry => {
                const context = contexts.get(entry.target);
                if (!context) return;
                context.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
                qualify(entry.target, context);
            }), {threshold: 0.5});
            promoLinks.forEach(link => observer.observe(link));
            // Re-observe on return so visibility is evaluated against current geometry.
            document.addEventListener('visibilitychange', () => {
                contexts.forEach((context, link) => {
                    expire(link, context);
                    context.ratio = 0;
                    observer.unobserve(link); observer.observe(link);
                });
            });
        }
        let expiryTimer;
        function checkExpiry() {
            clearTimeout(expiryTimer);
            let next = Infinity;
            contexts.forEach((context, link) => {
                expire(link, context);
                if (context.offer && context.offer.ends_at) next = Math.min(next, Date.parse(context.offer.ends_at));
            });
            if (Number.isFinite(next)) expiryTimer = setTimeout(checkExpiry, Math.min(2147483647, Math.max(1, next - Date.now())));
        }
        window.addEventListener('pageshow', checkExpiry);
        window.addEventListener('pagehide', () => clearTimeout(expiryTimer));
        checkExpiry();
        // Never delay observation or relabel this page with a newer catalog.
        if (state && state.group === 'rotation') await loadLdshopCatalog();
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

    function attachCodeTracking() {
        document.addEventListener('lastz:code-copied', (event) => {
            const copyButton = event.target.closest('[data-copy-code]');
            if (!copyButton) return;
            const card = copyButton.closest('.code-card');
            const isFresh = Boolean(card && card.querySelector('.status-pill--fresh'));
            track('code_copy', {
                code_status: isFresh ? 'fresh' : 'active',
                interaction_source: 'active_codes',
                page_type: 'guide',
                guide_slug: slugFromUrl(getPath())
            });
        });

    }

    function attachCalculatorTracking() {
        const calculators = {
            'vehicle-planner': {
                resultId: 'vehicle-planner-results',
                calculatorId: 'vehicle-modification'
            },
            'ar-planner': {
                resultId: 'ar-planner-results',
                calculatorId: 'alliance-recognition'
            }
        };
        document.addEventListener('submit', (event) => {
            const contract = calculators[event.target && event.target.id];
            if (!contract) return;
            const result = document.getElementById(contract.resultId);
            const input = event.target.querySelector('input[type="number"]');
            const inputValue = input ? input.value.trim() : '';
            const numericValue = Number(inputValue);
            if (!result || result.hidden || !inputValue
                || !Number.isFinite(numericValue) || numericValue < 0
                || !input.validity.valid) return;
            const path = getPath();
            track('calculator_result', {
                calculator_id: contract.calculatorId,
                guide_slug: slugFromUrl(path),
                page_type: 'guide'
            });
        });
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
        attachNavigationTracking();
        attachHomeTracking();
        attachGuideTracking();
        attachLdshopPromoTracking();
        attachGiftCenterTracking();
        attachCodeTracking();
        attachCalculatorTracking();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
