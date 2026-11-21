(() => {
    const placements = document.querySelectorAll('.content-placement');
    for (const placement of placements) {
        const slot = placement.querySelector('ins.adsbygoogle');
        const syncStatus = () => {
            placement.classList.toggle('is-empty', slot.dataset.adStatus === 'unfilled');
        };
        new MutationObserver(syncStatus).observe(slot, {
            attributes: true,
            attributeFilter: ['data-ad-status']
        });
        syncStatus();
    }

    // A deferred listener can miss an early loader error. The inline Google
    // snippet leaves an ordinary queue until the asynchronous library takes over.
    const loader = document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    const hideEmpty = () => {
        const queue = window.adsbygoogle;
        if (queue && (queue.loaded || !Array.isArray(queue) || queue.push !== Array.prototype.push)) return;
        for (const placement of placements) {
            if (!placement.querySelector('ins iframe')) {
                placement.classList.add('is-empty');
            }
        }
    };
    loader.addEventListener('error', hideEmpty, { once: true });
    // Restore the reserved space if a slow network completes after the timeout.
    loader.addEventListener('load', () => {
        for (const placement of placements) {
            if (!placement.querySelector('ins[data-ad-status="unfilled"]')) {
                placement.classList.remove('is-empty');
            }
        }
    }, { once: true });
    // Page load also settles a cached or blocked async script whose error
    // happened before this deferred listener. Collapse it before ordinary scrolling.
    window.addEventListener('load', hideEmpty, { once: true });
    window.setTimeout(hideEmpty, 5000);
})();
