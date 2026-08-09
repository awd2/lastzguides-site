/**
 * Lightweight GA4 event tracking helpers.
 * Uses gtag when available and no-ops otherwise.
 */
(function() {
    'use strict';

    const MEASUREMENT_ID = 'G-PYBSRQ1QFP';
    const LDSHOP_EXPERIMENT = {
        id: 'ldshop_argument_rotation_v1',
        storageKey: 'lastz_ldshop_argument_rotation_v1',
        durationMs: 28 * 24 * 60 * 60 * 1000,
        currentCreativeId: 'current_bundle',
        rotationCreativeIds: ['base_saving_21', 'new_user_15', 'lastzguides_5'],
        creatives: {
            base_saving_21: {
                dealSmall: 'Up to',
                dealBig: '21%',
                dealLabel: 'Off',
                title: 'Top up Last Z for less',
                textParts: [
                    'Get the same Last Z packs for ',
                    { strong: 'up to 21% less' },
                    ' than in-game.'
                ]
            },
            new_user_15: {
                dealSmall: 'New user',
                dealBig: '15%',
                dealLabel: 'Coupon',
                title: 'New to LDShop? Get a 15% coupon',
                textParts: [
                    'Take an ',
                    { strong: 'additional 15% off' },
                    ' your first eligible Last Z top-up.'
                ]
            },
            lastzguides_5: {
                dealSmall: 'Exclusive',
                dealBig: '5%',
                dealLabel: 'Coupon',
                title: 'Get the exclusive LastZGuides 5% coupon',
                textParts: [
                    { strong: 'No code to enter' },
                    ' — the coupon is added to your new LDShop account automatically.'
                ]
            }
        }
    };
    const tableDepthMarks = new Map();

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

    function validLdshopExperimentState(state) {
        if (!state || state.experiment_id !== LDSHOP_EXPERIMENT.id) return false;
        if (state.group !== 'control' && state.group !== 'rotation') return false;
        if (!Number.isInteger(state.qualified_exposures) || state.qualified_exposures < 0) return false;
        if (!Number.isFinite(state.expires_at) || state.expires_at <= Date.now()) return false;
        if (!Array.isArray(state.rotation_order)
            || state.rotation_order.length !== LDSHOP_EXPERIMENT.rotationCreativeIds.length) {
            return false;
        }
        const expected = LDSHOP_EXPERIMENT.rotationCreativeIds.slice().sort().join('|');
        return state.rotation_order.slice().sort().join('|') === expected;
    }

    function readLdshopExperimentState() {
        try {
            if (!window.localStorage) return null;
            const state = JSON.parse(window.localStorage.getItem(LDSHOP_EXPERIMENT.storageKey) || 'null');
            if (validLdshopExperimentState(state)) return state;
            window.localStorage.removeItem(LDSHOP_EXPERIMENT.storageKey);
        } catch (err) {
            // Storage failures leave the current banner in place and outside the experiment.
        }
        return null;
    }

    function writeLdshopExperimentState(state) {
        try {
            if (!window.localStorage) return false;
            window.localStorage.setItem(LDSHOP_EXPERIMENT.storageKey, JSON.stringify(state));
            return true;
        } catch (err) {
            return false;
        }
    }

    function shuffledLdshopCreativeIds() {
        const values = LDSHOP_EXPERIMENT.rotationCreativeIds.slice();
        for (let index = values.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
        }
        return values;
    }

    function createLdshopExperimentState() {
        const state = {
            experiment_id: LDSHOP_EXPERIMENT.id,
            group: Math.random() < 0.5 ? 'control' : 'rotation',
            rotation_order: shuffledLdshopCreativeIds(),
            qualified_exposures: 0,
            clicked_on_first_exposure: false,
            eligibility_recorded: false,
            first_click_recorded: false,
            expires_at: Date.now() + LDSHOP_EXPERIMENT.durationMs
        };
        return writeLdshopExperimentState(state) ? state : null;
    }

    function ldshopExposureBucket(exposureNumber) {
        return exposureNumber >= 4 ? '4_plus' : String(exposureNumber);
    }

    function ldshopPresentation(state) {
        const exposureNumber = state ? state.qualified_exposures + 1 : 1;
        if (!state || state.group === 'control') {
            return {
                creativeId: LDSHOP_EXPERIMENT.currentCreativeId,
                exposureNumber,
                sequencePosition: 1
            };
        }

        const sequencePosition = ((exposureNumber - 1) % 4) + 1;
        return {
            creativeId: sequencePosition === 1
                ? LDSHOP_EXPERIMENT.currentCreativeId
                : state.rotation_order[sequencePosition - 2],
            exposureNumber,
            sequencePosition
        };
    }

    function replaceLdshopText(element, parts) {
        if (!element) return;
        const nodes = parts.map((part) => {
            if (typeof part === 'string') return document.createTextNode(part);
            const strong = document.createElement('strong');
            strong.textContent = part.strong;
            return strong;
        });
        element.replaceChildren(...nodes);
    }

    function applyLdshopPresentation(link, state, selectedPresentation) {
        const presentation = selectedPresentation || ldshopPresentation(state);
        const creative = LDSHOP_EXPERIMENT.creatives[presentation.creativeId];
        if (creative) {
            const deal = link.querySelector('.ldshop-promo__deal');
            const dealSmall = deal ? deal.querySelector('.ldshop-promo__deal-small') : null;
            const dealBig = deal ? deal.querySelector('.ldshop-promo__deal-big') : null;
            const dealLabel = deal ? deal.querySelector('.ldshop-promo__deal-label') : null;
            const title = link.querySelector('.ldshop-promo__title');
            if (dealSmall) dealSmall.textContent = creative.dealSmall;
            if (dealBig) dealBig.textContent = creative.dealBig;
            if (dealLabel) dealLabel.textContent = creative.dealLabel;
            if (title) title.textContent = creative.title;
            replaceLdshopText(link.querySelector('.ldshop-promo__text'), creative.textParts);
        }

        link.dataset.ldshopExperimentId = state ? LDSHOP_EXPERIMENT.id : '';
        link.dataset.ldshopExperimentGroup = state ? state.group : '';
        link.dataset.ldshopCreativeId = presentation.creativeId;
        link.dataset.ldshopExposureNumber = String(presentation.exposureNumber);
        link.dataset.ldshopSequencePosition = String(presentation.sequencePosition);
        link.dataset.ldshopExperimentEligible = state && state.eligibility_recorded ? 'true' : 'false';
        return presentation;
    }

    function ldshopExperimentParams(link) {
        const experimentId = link.dataset.ldshopExperimentId || '';
        if (!experimentId) return {};
        const exposureNumber = Number.parseInt(link.dataset.ldshopExposureNumber || '1', 10);
        return {
            experiment_id: experimentId,
            experiment_group: link.dataset.ldshopExperimentGroup || '',
            creative_id: link.dataset.ldshopCreativeId || LDSHOP_EXPERIMENT.currentCreativeId,
            exposure_number: exposureNumber,
            exposure_bucket: ldshopExposureBucket(exposureNumber),
            sequence_position: link.dataset.ldshopSequencePosition || '1',
            experiment_eligible: link.dataset.ldshopExperimentEligible === 'true'
        };
    }

    function ldshopPromoParams(link) {
        const path = getPath();
        return Object.assign({
            partner: 'ldshop',
            placement_id: link.getAttribute('data-placement-id') || 'ldshop-promo',
            page_path: window.location.pathname || '/',
            page_type: path === 'index.html' ? 'home' : 'guide',
            guide_slug: slugFromUrl(path)
        }, ldshopExperimentParams(link));
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

    function attachLdshopPromoTracking() {
        const promoLinks = document.querySelectorAll('[data-ldshop-placement]');
        const contexts = new WeakMap();
        promoLinks.forEach((link) => {
            const experimentPlacement = link.matches('.ldshop-promo');
            const state = experimentPlacement && isEnglishPage()
                ? readLdshopExperimentState()
                : null;
            const presentation = experimentPlacement
                ? applyLdshopPresentation(link, state)
                : null;
            contexts.set(link, { state, presentation, viewed: false, experimentPlacement });
        });

        function recordView(link) {
            const context = contexts.get(link) || { state: null, viewed: false };
            if (context.viewed) return context;
            context.viewed = true;

            if (context.experimentPlacement && isEnglishPage()) {
                context.state = context.state || createLdshopExperimentState();
                if (context.state) {
                    const presentation = context.presentation || ldshopPresentation(context.state);
                    context.state.qualified_exposures = presentation.exposureNumber;
                    const becameEligible = presentation.exposureNumber >= 2
                        && !context.state.clicked_on_first_exposure
                        && !context.state.eligibility_recorded;
                    if (becameEligible) {
                        context.state.eligibility_recorded = true;
                    }
                    writeLdshopExperimentState(context.state);
                    applyLdshopPresentation(link, context.state, presentation);
                    context.presentation = presentation;
                    contexts.set(link, context);
                    track('ldshop_promo_view', ldshopPromoParams(link));
                    if (becameEligible) {
                        track('ldshop_experiment_eligible', ldshopPromoParams(link));
                    }
                    return context;
                }
            }

            contexts.set(link, context);
            track('ldshop_promo_view', ldshopPromoParams(link));
            return context;
        }

        if (promoLinks.length > 0 && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const context = contexts.get(entry.target);
                    if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || (context && context.viewed)) {
                        return;
                    }
                    recordView(entry.target);
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.5 });
            promoLinks.forEach((link) => observer.observe(link));
        }

        document.addEventListener('click', (event) => {
            const link = event.target.closest('[data-ldshop-placement]');
            if (!link) return;
            let context = contexts.get(link) || { state: null, viewed: false, experimentPlacement: false };
            if (context.experimentPlacement) {
                context = recordView(link);
            }
            track('ldshop_promo_click', Object.assign(ldshopPromoParams(link), {
                destination_url: link.href,
                ldshop_clicker_id: getOrCreateClickerId()
            }));
            if (!context.state) return;

            const exposureNumber = context.state.qualified_exposures;
            if (exposureNumber === 1) {
                context.state.clicked_on_first_exposure = true;
                writeLdshopExperimentState(context.state);
                applyLdshopPresentation(link, context.state, context.presentation);
                return;
            }
            if (context.state.eligibility_recorded && !context.state.first_click_recorded) {
                context.state.first_click_recorded = true;
                writeLdshopExperimentState(context.state);
                track('ldshop_experiment_first_click', Object.assign(ldshopPromoParams(link), {
                    destination_url: link.href
                }));
            }
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
