(function () {
  'use strict';
  const locale = typeof document === 'undefined' ? 'en-US' : ({ fr: 'fr-FR', es: 'es-ES' }[document.documentElement?.lang.split('-')[0]] || 'en-US');

  // Parse decimal text exactly before converting to Number: never round input points.
  function parsePower(raw, language = locale) {
    let text = raw.trim();
    if (language === 'fr' || language === 'fr-FR') {
      if (/^\d+(?:[,.]\d+)?[ \u00a0\u202f]*m$/i.test(text)) text = text.replace(',', '.').replace(/[ \u00a0\u202f]/g, '');
      else if (/^\d{1,3}(,\d{3}){2,}$/.test(text)) text = text.replace(/,/g, '');
      else if (/^\d+$/.test(text) || /^\d{1,3}([ \u00a0\u202f]\d{3})+$/.test(text)) text = text.replace(/[ \u00a0\u202f]/g, '');
      else return null;
    } else if (language === 'es' || language === 'es-ES') {
      if (/^\d+(?:[,.]\d+)? *m$/i.test(text)) text = text.replace(',', '.').replace(/ /g, '');
      else if (/^\d{1,3}(,\d{3}){2,}$/.test(text)) text = text.replace(/,/g, '');
      else if (/^\d+$/.test(text) || /^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
      else return null;
    }
    if (!text) return null;
    let digits;
    const millions = /^(\d+)(?:\.(\d+))?m$/i.exec(text);
    if (millions) {
      const fraction = millions[2] || '';
      if (/[1-9]/.test(fraction.slice(6))) return null;
      digits = millions[1] + fraction.slice(0, 6).padEnd(6, '0');
    } else if (/^\d+$/.test(text) || /^\d{1,3}(,\d{3})+$/.test(text) || /^\d{1,3}( \d{3})+$/.test(text)) {
      digits = text.replace(/[, ]/g, '');
    } else {
      return null;
    }
    const number = Number(digits);
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
  }

  function estimate(values) {
    // Integer hundredths keep exact tier boundaries stable for whole-point inputs.
    const [structure, tech, hero, vehicle] = values.map(BigInt);
    const hundredths = 6n * (structure + tech) + 120n * hero + 110n * vehicle - 4300000000n;
    return Number(hundredths) / 100;
  }

  function formatPower(raw, language = locale) {
    const value = parsePower(raw, language);
    return value === null || /m$/i.test(raw.trim()) ? raw : value.toLocaleString(language);
  }

  function formatPowerDuringInput(raw, inputType) {
    // Preserve localized decimal/group separators while typing; normalize on blur.
    if (locale !== 'en-US') return raw;
    if (/^[\d, ]+$/.test(raw)) {
      return formatPower(inputType === 'insertFromPaste' ? raw : raw.replace(/[, ]/g, ''));
    }
    if (inputType !== 'insertFromPaste' && /^[\d, ]+m$/i.test(raw)) return raw.replace(/[, ]/g, '');
    return raw;
  }

  // Server 403 thresholds for September 25–October 2, 2026; use unrounded score.
  function estimateTier(score) {
    if (!Number.isFinite(score) || score <= 0) return null;
    if (score > 160000000) return 'Elite';
    if (score >= 80000000) return 'Advanced';
    if (score >= 40000000) return 'Intermediate';
    return 'Regular';
  }

  const ranges = [[55381492, 119039790], [15061106, 28743986], [53140132, 100189547], [7267876, 16049747]];
  function isExtrapolation(values) {
    return values.some((value, index) => value < ranges[index][0] || value > ranges[index][1]);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { parsePower, estimate, isExtrapolation, formatPower, formatPowerDuringInput, estimateTier };
  if (typeof document === 'undefined') return;
  const form = document.getElementById('migration-score-form');
  if (!form) return;
  const fields = ['structure', 'tech', 'hero', 'vehicle'];
  // Keep inputs unnamed so native submission cannot transmit power if JS fails.
  const inputs = fields.map(name => document.getElementById('score-' + name));
  const result = document.getElementById('score-result');
  const stringBlock = document.getElementById('calculator-strings');
  const text = key => stringBlock.content?.querySelector('[data-string="' + key + '"]').textContent || '';
  const initial = text('initial');

  function showResult(messages) {
    result.replaceChildren(...messages.map(({ text, className }) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      if (className) paragraph.className = className;
      return paragraph;
    }));
  }
  function clearResult() { showResult([{ text: initial }]); }
  function clearError(index) {
    inputs[index].removeAttribute('aria-invalid');
    document.getElementById(fields[index] + '-error').textContent = '';
  }
  inputs.forEach((input, index) => input.addEventListener('input', event => {
    clearResult();
    clearError(index);
    const raw = input.value;
    const formatted = formatPowerDuringInput(raw, event.inputType);
    if (formatted === raw) return;
    const beforeCaret = raw.slice(0, input.selectionStart);
    input.value = formatted;
    let caret;
    if (/m$/i.test(formatted)) {
      caret = beforeCaret.replace(/[, ]/g, '').length;
    } else {
      const digitsBeforeCaret = beforeCaret.replace(/\D/g, '').length;
      caret = 0;
      for (let digits = 0; caret < formatted.length && digits < digitsBeforeCaret; caret++) {
        if (/\d/.test(formatted[caret])) digits++;
      }
      if (beforeCaret.length === raw.length) caret = formatted.length;
    }
    input.setSelectionRange(caret, caret);
  }));
  inputs.forEach(input => input.addEventListener('blur', () => {
    input.value = formatPower(input.value);
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    const values = inputs.map(input => parsePower(input.value));
    let firstInvalid = -1;
    values.forEach((value, index) => {
      clearError(index);
      if (value === null) {
        if (firstInvalid === -1) firstInvalid = index;
        inputs[index].setAttribute('aria-invalid', 'true');
        document.getElementById(fields[index] + '-error').textContent = inputs[index].value.trim()
          ? text('invalid')
          : text('required');
      }
    });
    if (firstInvalid !== -1) { inputs[firstInvalid].focus(); return; }
    const score = estimate(values);
    if (score <= 0) {
      showResult([{ text: text('unusable') }]);
      return;
    }
    const messages = [
      { text: (locale === 'en-US' ? (score / 1000000).toFixed(1) : (score / 1000000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })) + 'M', className: 'score-value' },
      { text: text('tier-' + estimateTier(score)), className: 'score-tier' }
    ];
    if (isExtrapolation(values)) messages.push({ text: text('extrapolation') });
    showResult(messages);
  });
  form.addEventListener('reset', () => {
    inputs.forEach((input, index) => {
      clearError(index);
    });
    clearResult();
  });
}());
