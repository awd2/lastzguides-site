(() => {
  'use strict';
  const data = typeof window === 'undefined' ? null : window.equipmentCosts;
  const forgeNames = ['No forging', '+1', '+2', '+3', '+4', '+5', 'MAX'];
  const specs = {
    forge: [
      { key: 'stones', label: 'Forging Stones', format: value => formatInt(value), parse: parseWhole },
      { key: 'modules', label: 'Pulse Modules', format: value => formatInt(value), parse: parseWhole },
      { key: 'electricity', label: 'Electricity', format: value => formatMillions(value), parse: parseMillions }
    ],
    promote: [
      { key: 'cores', label: 'Power Cores', format: value => formatInt(value), parse: parseWhole },
      { key: 'zents', label: 'Zent', format: value => formatMillions(value), parse: parseMillions },
      { key: 'orange', label: 'Spare orange items', format: value => formatInt(value), parse: parseWhole }
    ]
  };
  function formatInt(value) { return value.toLocaleString('en-US'); }
  function formatMillions(value) { return `${(value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 6 })}M`; }
  function parseWhole(text) {
    if (!/^\d+$/.test(text.trim())) return null;
    const n = Number(text);
    return Number.isSafeInteger(n) ? n : null;
  }
  function parseMillions(text) {
    if (!/^\d+(?:\.\d{1,6})?$/.test(text.trim())) return null;
    const [whole, fraction = ''] = text.trim().split('.');
    const n = Number(whole) * 1000000 + Number(fraction.padEnd(6, '0'));
    return Number.isSafeInteger(n) ? n : null;
  }
  function promotionName(step) {
    if (step === 0) return 'No promotion';
    const stars = Math.floor(step / 6), part = step % 6;
    if (part === 0) return `${stars}★`;
    return stars ? `${stars}★ + ${part}/6` : `${part}/6`;
  }
  function cost(kind, from, to, source = data) {
    const total = Object.fromEntries(specs[kind].map(item => [item.key, 0]));
    if (from > to) return null;
    for (let index = from; index < to; index++) {
      const row = source[kind === 'forge' ? 'forging' : 'promotion'][index];
      if (kind === 'forge') {
        total.stones += row.stones;
        total.modules += row.modules;
        total.electricity += row.electricity * 1000000;
      } else {
        total.cores += row.cores;
        total.zents += row.zents_m * 1000000;
        total.orange += row.orange;
      }
    }
    return total;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseWhole, parseMillions, promotionName, cost };
  if (typeof document === 'undefined' || !data) return;

  function add(parent, tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = content;
    parent.appendChild(element);
    return element;
  }
  function addIcon(parent, item) {
    const icon = document.getElementById('resource-icons').content.querySelector(`[data-icon="${item.key}"]`);
    if (icon) parent.appendChild(icon.cloneNode(true));
  }
  const usedTools = new Set();
  function recordUse(kind) {
    if (usedTools.has(kind)) return;
    usedTools.add(kind);
    window.analytics?.trackEvent?.('calculator_result', { calculator_id: kind === 'forge' ? 'equipment-forging' : 'equipment-promotion', guide_slug: 'equipment-calculator', page_type: 'guide', interaction_source: 'equipment_calculator' });
  }

  function selectTool(name, focus = false) {
    for (const tool of ['promotion', 'forging']) {
      const selected = name === tool;
      const tab = document.getElementById(`${tool}-tab`);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tool).hidden = !selected;
    }
    if (focus) document.getElementById(`${name}-tab`).focus();
  }
  const tabNames = ['promotion', 'forging'];
  for (const name of tabNames) {
    const tab = document.getElementById(`${name}-tab`);
    tab.disabled = false;
    tab.addEventListener('click', () => { selectTool(name); history.replaceState(null, '', `#${name}`); });
    tab.addEventListener('keydown', event => {
      const index = tabNames.indexOf(name);
      const next = event.key === 'ArrowRight' ? tabNames[(index + 1) % 2]
        : event.key === 'ArrowLeft' ? tabNames[(index + 1) % 2]
        : event.key === 'Home' ? tabNames[0]
        : event.key === 'End' ? tabNames[1] : null;
      if (!next) return;
      event.preventDefault();
      selectTool(next, true);
      history.replaceState(null, '', `#${next}`);
    });
  }
  function selectFromHash() { selectTool(location.hash === '#forging' ? 'forging' : 'promotion'); }
  window.addEventListener('hashchange', selectFromHash);
  selectFromHash();

  function setup(kind) {
    const from = document.getElementById(`${kind}-from`);
    const to = document.getElementById(`${kind}-to`);
    const costBox = document.getElementById(`${kind}-cost`);
    const requirement = document.getElementById(`${kind}-requirement`);
    const inventoryBox = document.getElementById(`${kind}-inventory`);
    const missingBox = document.getElementById(`${kind}-missing`);
    const disclosure = inventoryBox.closest('details');
    const saved = {};
    let active = [];
    let total = {};
    let lastMissing = '';
    function renderMissing() {
      missingBox.replaceChildren();
      if (!disclosure.open) return false;
      if (!active.length) { add(missingBox, 'p', '', 'Nothing else is needed for this transition.'); return false; }
      const missing = [];
      for (const item of active) {
        const input = inventoryBox.querySelector(`[data-resource="${item.key}"]`);
        const entered = input.value.trim() ? item.parse(input.value) : 0;
        if (entered === null) {
          input.setAttribute('aria-invalid', 'true');
          add(missingBox, 'p', 'input-error', `Enter a non-negative ${item.key === 'zents' || item.key === 'electricity' ? 'amount in millions with up to six decimal places' : 'whole number'} for ${item.label}.`);
          return false;
        }
        input.removeAttribute('aria-invalid');
        missing.push({ item, amount: Math.max(0, total[item.key] - entered) });
      }
      add(missingBox, 'h3', '', 'Still missing after inventory');
      const grid = add(missingBox, 'div', 'resource-grid', '');
      for (const row of missing) {
        const cell = add(grid, 'div', 'resource', '');
        const name = add(cell, 'span', 'resource-name', '');
        addIcon(name, row.item);
        name.append(row.item.label);
        add(cell, 'strong', '', row.item.format(row.amount));
      }
      add(missingBox, 'p', 'result-note', missing.some(row => row.amount > 0) ? 'More materials are needed for this target.' : 'Your entered inventory covers this cost.');
      const signature = JSON.stringify(missing.map(row => row.amount));
      const changed = signature !== lastMissing;
      lastMissing = signature;
      return changed;
    }
    function updateTargets(adjustCurrent) {
      const start = Number(from.value), end = Number(to.value);
      for (const option of to.options) option.disabled = Number(option.value) < start;
      if (adjustCurrent && end <= start) to.value = String(Math.min(start + 1, kind === 'forge' ? 6 : 30));
      else if (end < start) to.value = String(start);
    }
    function render() {
      const start = Number(from.value);
      const target = Number(to.value);
      total = cost(kind, start, target);
      active = specs[kind].filter(item => total[item.key] > 0);
      costBox.replaceChildren();
      if (!active.length) add(costBox, 'p', 'zero-result', 'No additional materials');
      for (const item of active) {
        const cell = add(costBox, 'div', 'resource', '');
        const name = add(cell, 'span', 'resource-name', '');
        addIcon(name, item);
        name.append(item.label);
        add(cell, 'strong', '', item.format(total[item.key]));
      }
      if (kind === 'forge') {
        const gate = data.forging[target - 1];
        requirement.textContent = target === start ? 'No new forging stage selected.' : `Requirement for ${forgeNames[target]}: enhancement level ${gate.level} and ${gate.stars} completed promotion ${gate.stars === 1 ? 'star' : 'stars'}.`;
      } else {
        requirement.textContent = target === start ? 'No new promotion step selected.' : 'Promotion unlocks at enhancement level 20.';
      }
      for (const input of inventoryBox.querySelectorAll('input[data-resource]')) saved[input.dataset.resource] = input.value;
      inventoryBox.replaceChildren();
      for (const item of active) {
        const wrap = add(inventoryBox, 'div', 'field', '');
        const inputId = `${kind}-have-${item.key}`;
        const label = add(wrap, 'label', '', '');
        addIcon(label, item);
        label.append(`${item.label} available${item.key === 'zents' || item.key === 'electricity' ? ' (M)' : ''}`);
        label.htmlFor = inputId;
        const input = add(wrap, 'input', '', '');
        input.id = inputId;
        input.dataset.resource = item.key;
        input.type = 'text';
        input.inputMode = item.key === 'zents' || item.key === 'electricity' ? 'decimal' : 'numeric';
        input.value = saved[item.key] || '';
        input.autocomplete = 'off';
        input.addEventListener('input', () => { saved[item.key] = input.value; if (renderMissing()) recordUse(kind); });
      }
      renderMissing();
    }
    from.addEventListener('change', () => { const before = `${from.dataset.last}|${to.value}`; updateTargets(true); render(); if (before !== `${from.value}|${to.value}`) recordUse(kind); from.dataset.last = from.value; });
    to.addEventListener('change', () => { updateTargets(false); render(); recordUse(kind); });
    disclosure.addEventListener('toggle', renderMissing);
    updateTargets(false);
    render();
    from.dataset.last = from.value;
    from.disabled = false;
    to.disabled = false;
    disclosure.inert = false;
  }
  setup('forge');
  setup('promote');
})();
