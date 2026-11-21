(() => {
    const template = document.getElementById('support-prompt-template');
    if (!template) return;

    const key = 'lastz.support.prompt.v1';
    const day = 24 * 60 * 60 * 1000;
    let card;
    let observer;

    function readDeadline() {
        try { return Number(window.localStorage.getItem(key)) || 0; }
        catch (_) { return 0; }
    }

    function suppress(days) {
        try { window.localStorage.setItem(key, String(Date.now() + days * day)); }
        catch (_) { /* The one-time listener still caps this page view. */ }
    }

    function hide() {
        if (!card) return;
        observer?.disconnect();
        const summary = card.previousElementSibling;
        const restoreFocus = card.contains(document.activeElement);
        card.remove();
        card = null;
        if (restoreFocus) {
            summary.setAttribute('tabindex', '-1');
            summary.focus({ preventScroll: true });
        }
    }

    function insertCard() {
        // The preceding dashboard can be sticky. Use the next in-flow element
        // to measure the insertion point, including margins and native anchoring.
        let anchor = template.nextElementSibling;
        while (anchor && !anchor.getClientRects().length) anchor = anchor.nextElementSibling;
        const top = anchor?.getBoundingClientRect().top;
        template.replaceWith(card);
        if (top < 0) {
            const shift = anchor.getBoundingClientRect().top - top;
            if (shift) window.scrollBy({ top: shift, behavior: 'instant' });
        }
    }

    function trackView(placement) {
        const record = () => window.analytics?.trackEvent?.('support_prompt_view', { placement });
        if (typeof window.IntersectionObserver !== 'function') {
            record();
            return;
        }
        observer = new window.IntersectionObserver(entries => {
            if (card && observer && entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
                observer.disconnect();
                observer = null;
                record();
            }
        }, { threshold: 0.5 });
        observer.observe(card);
    }

    document.addEventListener('lastz:support-result', () => {
        if (readDeadline() > Date.now()) return;
        card = template.content.firstElementChild.cloneNode(true);
        const link = card.querySelector('a');
        card.querySelector('button').addEventListener('click', () => {
            suppress(30);
            hide();
        });
        link.addEventListener('click', () => {
            suppress(30);
            // Let the native link activate before removing its element.
            window.setTimeout(hide, 0);
        });
        insertCard();
        suppress(1);
        trackView(link.dataset.supportPlacement);
    }, { once: true });

    window.addEventListener('storage', event => {
        if (event.key === key && Number(event.newValue) > Date.now() + day) hide();
    });
})();
