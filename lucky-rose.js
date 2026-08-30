(function() {
    'use strict';

    var expiryTimer = null;
    var copyResetTimer = null;
    var currentStatus = null;

    function confirmed(status) {
        if (!status || status.status !== 'confirmed') return false;
        if (!Number.isInteger(status.number) || status.number < 1 || status.number > 10) return false;
        if (!status.buff || !status.buff.label || !status.buff.duration) return false;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(status.week_start || '')) return false;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(status.week_end || '')) return false;
        var validUntil = Date.parse(status.valid_until);
        return Number.isFinite(validUntil) && validUntil > Date.now();
    }

    function formatDate(value, dayOffset) {
        var date = new Date(value + 'T12:00:00Z');
        if (dayOffset) date.setUTCDate(date.getUTCDate() + dayOffset);
        return new Intl.DateTimeFormat('en', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
        }).format(date);
    }

    function renderPending() {
        var card = document.querySelector('[data-lucky-rose-card]');
        if (!card) return;
        if (expiryTimer) window.clearTimeout(expiryTimer);
        expiryTimer = null;
        currentStatus = null;
        card.classList.add('is-pending');
        card.querySelector('[data-lucky-rose-kicker]').textContent = "Checking This Week's Lucky Rose";
        card.querySelector('[data-lucky-rose-number]').textContent = '?';
        card.querySelector('[data-lucky-rose-unit]').textContent = '';
        card.querySelector('[data-lucky-rose-buff]').textContent = '';
        card.querySelector('[data-lucky-rose-window]').textContent = '';
        card.querySelector('[data-lucky-rose-instruction]').textContent =
            "Last week's number has expired. Check back shortly — we will not show an old number as current.";
        var copyButton = card.querySelector('[data-lucky-rose-copy]');
        copyButton.disabled = true;
        copyButton.textContent = 'Copy for Alliance Chat';
        copyButton.classList.remove('is-copied');
    }

    function scheduleExpiry(status) {
        if (expiryTimer) window.clearTimeout(expiryTimer);
        var delay = Date.parse(status.valid_until) - Date.now();
        if (delay <= 0) {
            renderPending();
            return;
        }
        expiryTimer = window.setTimeout(renderPending, delay);
    }

    function render(status) {
        if (!confirmed(status)) {
            renderPending();
            return;
        }
        var card = document.querySelector('[data-lucky-rose-card]');
        if (!card) return;
        currentStatus = status;
        card.classList.remove('is-pending');
        card.querySelector('[data-lucky-rose-kicker]').textContent = 'Lucky Rose This Week';
        card.querySelector('[data-lucky-rose-number]').textContent = status.number;
        card.querySelector('[data-lucky-rose-unit]').textContent = 'Yellow Roses';
        card.querySelector('[data-lucky-rose-buff]').textContent = status.buff.label + ' · ' + status.buff.duration;
        card.querySelector('[data-lucky-rose-window]').textContent =
            'Valid ' + formatDate(status.week_start) + '–' + formatDate(status.week_end, -1) + ' · Apocalypse Time';
        card.querySelector('[data-lucky-rose-instruction]').textContent =
            'Send exactly ' + status.number + ' Yellow Roses to one player in a single gift. The buff applies to you, the sender.';
        var copyButton = card.querySelector('[data-lucky-rose-copy]');
        copyButton.disabled = false;
        copyButton.textContent = 'Copy for Alliance Chat';
        copyButton.classList.remove('is-copied');
        scheduleExpiry(status);
    }

    function compactBuff(label) {
        return label.replace(/Troop Attack/gi, 'Troop ATK');
    }

    function compactDuration(duration) {
        return duration
            .replace(/\s*hours?\b/i, 'h')
            .replace(/\s*minutes?\b/i, 'm')
            .replace(/\s*seconds?\b/i, 's');
    }

    function allianceMessage(status) {
        return '🌹 Lucky Rose this week: ' + status.number + ' → ' +
            compactBuff(status.buff.label) + ' (' + compactDuration(status.buff.duration) + '). ' +
            'Send exactly ' + status.number + ' Yellow Roses to one player in a single gift. ' +
            'The buff applies to the sender.';
    }

    function copyFallback(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        var copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied ? Promise.resolve() : Promise.reject(new Error('Copy failed'));
    }

    function copyAllianceMessage(button) {
        if (!currentStatus || button.disabled) return;
        if (!confirmed(currentStatus)) {
            renderPending();
            return;
        }
        var text = allianceMessage(currentStatus);
        var clipboard = window.navigator && window.navigator.clipboard;
        var copyPromise = clipboard && clipboard.writeText
            ? clipboard.writeText(text)
            : copyFallback(text);

        copyPromise.then(function() {
            if (copyResetTimer) window.clearTimeout(copyResetTimer);
            button.textContent = 'Copied';
            button.classList.add('is-copied');
            copyResetTimer = window.setTimeout(function() {
                button.textContent = 'Copy for Alliance Chat';
                button.classList.remove('is-copied');
                copyResetTimer = null;
            }, 1600);
        }).catch(function() {
            button.textContent = 'Copy failed';
        });
    }

    function load() {
        var statusPromise = window.lastzLuckyRoseStatusPromise;
        if (!statusPromise && window.fetch) {
            var statusUrl = window.lastzLuckyRoseStatusUrl ||
                'https://lastz-lucky-rose.o-smolerov.workers.dev/lucky-rose-status.json';
            statusPromise = window.fetch(statusUrl, { credentials: 'omit' })
                .then(function(response) {
                    if (!response.ok) throw new Error('Lucky Rose status unavailable');
                    return response.json();
                });
        }
        if (statusPromise) statusPromise.then(render).catch(function() {});
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && currentStatus && !confirmed(currentStatus)) renderPending();
    });

    document.addEventListener('click', function(event) {
        var button = event.target.closest('[data-lucky-rose-copy]');
        if (button) copyAllianceMessage(button);
    });
})();
