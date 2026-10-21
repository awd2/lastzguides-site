(() => {
  'use strict';
  function parseTime(value) {
    if (value === '0.0') return 0;
    if (!/^(?:\d+d)?(?:\d+h)?(?:\d+m)?(?:\d+s)?$/.test(value) || !value) return null;
    const units = { d: 86400, h: 3600, m: 60, s: 1 };
    return [...value.matchAll(/(\d+)([dhms])/g)].reduce((sum, match) => sum + Number(match[1]) * units[match[2]], 0);
  }
  function parseSpeed(value) {
    const raw = value.trim().replace(/%$/, '').trim();
    if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;
    const speed = Number(raw);
    return Number.isFinite(speed) && speed >= 0 && speed <= 1000 ? speed : null;
  }
  function validPair(from, to) {
    return Number.isInteger(from) && Number.isInteger(to) && from >= 1 && from <= 34 && to > from && to <= 35;
  }
  function initialPair(search, saved) {
    const params = new URLSearchParams(search);
    const values = params.has('from') || params.has('to') ? [params.get('from'), params.get('to')] : saved;
    if (Array.isArray(values) && values.length === 2 && values.every(v => /^\d+$/.test(String(v)))) {
      const [from, to] = values.map(Number);
      if (validPair(from, to)) return [from, to];
    }
    return [30, 35];
  }
  function parseResource(value) {
    if (value === '—') return 0;
    const [whole, fraction = ''] = value.split('.');
    // Integer resource units preserve the table's exact decimal millions.
    return Number(whole) * 1000000 + Number(fraction.padEnd(6, '0'));
  }
  function readRow(cells) {
    return { level: Number(cells[0]), cap: Number(cells[1]), resources: cells.slice(2, 6).map(parseResource), buildings: cells.slice(6, 8).filter(name => name !== '—'), seconds: parseTime(cells[8]) };
  }
  function buildSeconds(seconds, speed) { return Math.floor(seconds * 100 / (100 + speed)); }
  function calculate(rows, from, to, speed = null) {
    if (!validPair(from, to)) return null;
    const selected = rows.filter(row => row.level > from && row.level <= to);
    return {
      resources: selected.reduce((total, row) => total.map((n, i) => n + row.resources[i]), [0, 0, 0, 0]),
      seconds: speed === null ? null : selected.reduce((sum, row) => sum + buildSeconds(row.seconds, speed), 0),
      cap: selected[selected.length - 1].cap,
      rows: selected
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseTime, parseSpeed, validPair, initialPair, readRow, buildSeconds, calculate };
  if (typeof document === 'undefined') return;
  const form = document.getElementById('hq-planner');
  if (!form) return;
  const from = document.getElementById('hq-from');
  const to = document.getElementById('hq-to');
  const speed = document.getElementById('hq-speed');
  const result = document.getElementById('hq-result');
  const error = document.getElementById('hq-error');
  const speedError = document.getElementById('hq-speed-error');
  const time = document.getElementById('hq-time');
  const timeNote = document.getElementById('hq-time-note');
  const buildings = document.getElementById('hq-buildings');
  const tableRows = [...document.querySelectorAll('.data-table tr[id^="hq-"]')];
  const rows = tableRows.map(row => readRow([...row.cells].map(cell => cell.textContent.trim())));
  const strings = Object.fromEntries([...document.getElementById('hq-strings').content.querySelectorAll('[data-string]')].map(node => [node.dataset.string, node.textContent]));
  const text = (key, values) => strings[key].replace(/\{(\w+)\}/g, (_, name) => values[name]);
  const locale = document.documentElement.lang || 'en';
  const format = value => value.toLocaleString(locale, { maximumFractionDigits: 6 });
  const seenPairs = new Set();
  let savedPair = null;
  try { savedPair = JSON.parse(localStorage.getItem('hq-upgrade-pair')); } catch { /* Storage is optional. */ }
  [from.value, to.value] = initialPair(location.search, savedPair).map(String);
  try {
    const savedSpeed = localStorage.getItem('hq-upgrade-speed');
    if (savedSpeed !== null && parseSpeed(savedSpeed) !== null) speed.value = savedSpeed;
  } catch { /* Storage is optional. */ }

  function render(userChange = false) {
    const start = Number(from.value), target = Number(to.value);
    const bonus = parseSpeed(speed.value);
    const invalidSpeed = speed.value.trim() !== '' && bonus === null;
    speedError.hidden = !invalidSpeed;
    speed.setAttribute('aria-invalid', String(invalidSpeed));
    const total = calculate(rows, start, target, bonus);
    error.hidden = !!total;
    result.hidden = !total;
    to.setAttribute('aria-invalid', String(!total));
    for (const row of tableRows) row.classList.toggle('hq-selected', !!total && Number(row.cells[0].textContent) > start && Number(row.cells[0].textContent) <= target);
    if (userChange) {
      try {
        if (speed.value.trim() === '') localStorage.removeItem('hq-upgrade-speed');
        else if (!invalidSpeed) localStorage.setItem('hq-upgrade-speed', String(bonus));
      } catch { /* Storage is optional. */ }
    }
    if (!total) return;
    const url = new URL(location.href);
    url.searchParams.set('from', start);
    url.searchParams.set('to', target);
    history.replaceState(null, '', url);
    try { localStorage.setItem('hq-upgrade-pair', JSON.stringify([start, target])); } catch { /* Storage is optional. */ }
    ['wood', 'food', 'zent', 'steel'].forEach((name, i) => {
      document.getElementById(`hq-${name}`).textContent = text('millions', { value: format(total.resources[i] / 1000000) });
    });
    document.getElementById('hq-cap').textContent = total.cap;
    time.textContent = bonus === null ? strings.timePrompt : text('time', {
      days: Math.floor(total.seconds / 86400), hours: Math.floor(total.seconds % 86400 / 3600), minutes: Math.floor(total.seconds % 3600 / 60)
    });
    time.classList.toggle('is-prompt', bonus === null);
    time.hidden = invalidSpeed;
    timeNote.hidden = bonus === null;
    buildings.replaceChildren(...total.rows.map(row => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#hq-${row.level}`;
      a.textContent = text('buildings', { level: row.level, buildings: row.buildings.join(strings.separator) || strings.noBuildings });
      li.append(a);
      return li;
    }));
    const pair = `${start}:${target}`;
    if (userChange && !invalidSpeed && !seenPairs.has(pair)) {
      seenPairs.add(pair);
      window.analytics?.trackEvent?.('calculator_result', { calculator_id: 'hq-upgrade', guide_slug: 'hq-construction-cost', page_type: 'guide', interaction_source: 'hq_calculator' });
    }
  }
  const tips = [...document.querySelectorAll('#hq-calculator .hq-tip')];
  document.addEventListener('click', event => {
    for (const tip of tips) if (!tip.querySelector('summary').contains(event.target)) tip.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') for (const tip of tips) tip.open = false;
  });
  for (const tip of tips) tip.addEventListener('toggle', () => {
    if (tip.open) for (const other of tips) if (other !== tip) other.open = false;
  });
  form.addEventListener('submit', event => event.preventDefault());
  from.addEventListener('change', () => render(true));
  to.addEventListener('change', () => render(true));
  speed.addEventListener('input', () => render(true));
  render();
  from.disabled = to.disabled = speed.disabled = false;
})();
