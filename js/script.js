'use strict';

const state = {
  currentInput: '0',
  previousInput: '',
  operator: null,
  shouldResetInput: false,
  justCalculated: false,
  history: [],
  isPowerMode: false,
  memory: 0,
};

console.log('[CALCULA] State initialised:', state);

const resultDisplay = document.getElementById('result');
const expressionDisplay = document.getElementById('expression');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const sciPanel = document.getElementById('scientificPanel');
const sciToggleBtn = document.getElementById('sciToggle');
const themeToggleBtn = document.getElementById('themeToggle');
const clearHistoryBtn = document.getElementById('clearHistory');
const memIndicator = document.getElementById('memIndicator');
const modeStandardBtn = document.getElementById('modeStandard');
const modeScientificBtn = document.getElementById('modeScientific');
const modeBadge = document.getElementById('modeBadge');

console.log('[CALCULA] DOM refs resolved:', {
  resultDisplay, expressionDisplay, historyList,
  sciPanel, themeToggleBtn, memIndicator, modeStandardBtn, modeScientificBtn
});

function updateDisplay() {
  console.log('[updateDisplay] currentInput:', state.currentInput, '| operator:', state.operator, '| previous:', state.previousInput);
  const val = state.currentInput;
  resultDisplay.textContent = formatDisplayNumber(val);

  resultDisplay.classList.remove('result--long', 'result--error');

  if (val === 'Error' || val.startsWith('Error') || val === 'Overflow' || val === 'Undefined') {
    resultDisplay.classList.add('result--error');
  } else if (val.replace('-', '').length >= 10) {
    resultDisplay.classList.add('result--long');
  }

  if (state.operator && state.previousInput !== '') {
    expressionDisplay.textContent = `${formatDisplayNumber(state.previousInput)} ${state.operator}`;
  } else {
    expressionDisplay.textContent = '';
  }
}

function formatDisplayNumber(numStr) {
  console.log('[formatDisplayNumber] input:', numStr);
  if (!numStr || numStr === 'Error' || numStr === 'Overflow' || numStr === 'Undefined' || numStr === 'Infinity' || numStr.startsWith('Error')) {
    return numStr;
  }
  if (numStr === '' || numStr === '-') return numStr;

  const hasTrailingDot = numStr.endsWith('.');
  const decimalPart = numStr.split('.')[1] || '';
  const trailingZeroStr = hasTrailingDot ? '' : (decimalPart.match(/0+$/) || [''])[0];

  const num = parseFloat(numStr);
  if (isNaN(num)) return numStr;

  let formatted;
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    formatted = num.toPrecision(8);
  } else {
    formatted = num.toLocaleString('en-US', {
      maximumFractionDigits: Math.min(decimalPart.length, 10),
      useGrouping: false,
    });
  }

  if (hasTrailingDot) formatted += '.';
  else if (trailingZeroStr) formatted += trailingZeroStr;

  return formatted;
}

function inputNumber(digit) {
  console.log('[inputNumber] digit:', digit, '| justCalculated:', state.justCalculated, '| shouldReset:', state.shouldResetInput);
  if (state.justCalculated) {
    state.currentInput = digit === '0' ? '0' : digit;
    state.shouldResetInput = false;
    state.justCalculated = false;
    updateDisplay();
    return;
  }

  if (state.shouldResetInput) {
    state.currentInput = digit === '0' ? '0' : digit;
    state.shouldResetInput = false;
  } else {
    const digitCount = state.currentInput.replace(/[^0-9]/g, '').length;
    if (digitCount >= 12) {
      console.warn('[inputNumber] Max digit limit reached');
      return;
    }
    if (state.currentInput === '0' && digit !== '.') {
      state.currentInput = digit;
    } else {
      state.currentInput += digit;
    }
  }
  updateDisplay();
}

function inputDecimal() {
  console.log('[inputDecimal] currentInput:', state.currentInput, '| justCalculated:', state.justCalculated);
  if (state.justCalculated) {
    state.currentInput = '0.';
    state.justCalculated = false;
    state.shouldResetInput = false;
    updateDisplay();
    return;
  }

  if (state.shouldResetInput) {
    state.currentInput = '0.';
    state.shouldResetInput = false;
    updateDisplay();
    return;
  }

  if (state.currentInput.includes('.')) {
    console.warn('[inputDecimal] Decimal already present');
    return;
  }

  state.currentInput += '.';
  updateDisplay();
}

function inputOperator(op) {
  console.log('[inputOperator] op:', op, '| currentInput:', state.currentInput, '| operator:', state.operator);
  state.justCalculated = false;

  if (state.operator !== null && state.shouldResetInput) {
    console.log('[inputOperator] Swapping operator to', op);
    state.operator = op;
    state.isPowerMode = (op === 'xʸ');
    highlightOperator(op);
    updateDisplay();
    return;
  }

  if (state.operator !== null && !state.shouldResetInput) {
    console.log('[inputOperator] Chaining operation');
    calculate(true);
  }

  state.previousInput = state.currentInput;
  state.operator = op;
  state.shouldResetInput = true;
  state.isPowerMode = (op === 'xʸ');

  highlightOperator(op);
  updateDisplay();
}

function highlightOperator(op) {
  console.log('[highlightOperator] active:', op);
  document.querySelectorAll('.btn--operator').forEach(btn => {
    btn.classList.remove('is-active');
    if (op && btn.dataset.value === op) {
      btn.classList.add('is-active');
    }
  });
}

function calculate(silent = false) {
  console.log('[calculate] operator:', state.operator, '| a:', state.previousInput, '| b:', state.currentInput, '| silent:', silent);
  if (state.operator === null || state.previousInput === '') {
    console.warn('[calculate] No pending operation');
    state.justCalculated = true;
    return;
  }

  const a = parseFloat(state.previousInput);
  const b = parseFloat(state.currentInput);

  if (isNaN(a) || isNaN(b)) {
    console.error('[calculate] NaN operand');
    showError('Error');
    return;
  }

  const expressionStr = `${formatDisplayNumber(state.previousInput)} ${state.operator} ${formatDisplayNumber(state.currentInput)}`;
  let result;

  switch (state.operator) {
    case '+': result = a + b; break;
    case '−': result = a - b; break;
    case '×': result = a * b; break;
    case '÷':
      if (b === 0) {
        console.error('[calculate] Div by zero');
        showError('Cannot ÷ 0');
        return;
      }
      result = a / b;
      break;
    case 'xʸ': result = Math.pow(a, b); break;
    default:
      console.error('[calculate] Unknown operator:', state.operator);
      showError('Error');
      return;
  }

  if (!isFinite(result)) {
    console.error('[calculate] Infinite result');
    showError('Overflow');
    return;
  }
  if (isNaN(result)) {
    console.error('[calculate] NaN result');
    showError('Error');
    return;
  }

  result = parseFloat(result.toPrecision(12));
  console.log('[calculate] Result:', result, '| expression:', expressionStr);
  const resultStr = String(result);

  if (!silent) addHistory(expressionStr, resultStr);

  state.currentInput = resultStr;
  state.previousInput = '';
  state.operator = null;
  state.shouldResetInput = false;
  state.justCalculated = true;
  state.isPowerMode = false;

  highlightOperator(null);
  updateDisplay();
}

function showError(msg) {
  console.error('[showError]', msg);
  state.currentInput = msg;
  state.previousInput = '';
  state.operator = null;
  state.shouldResetInput = true;
  state.justCalculated = false;
  state.isPowerMode = false;

  resultDisplay.textContent = msg;
  resultDisplay.classList.remove('result--long');
  resultDisplay.classList.add('result--error');
  expressionDisplay.textContent = '';
  highlightOperator(null);
}

function clearCalculator() {
  console.log('[clearCalculator] Reset state');
  state.currentInput = '0';
  state.previousInput = '';
  state.operator = null;
  state.shouldResetInput = false;
  state.justCalculated = false;
  state.isPowerMode = false;

  highlightOperator(null);
  updateDisplay();
}

function deleteLast() {
  console.log('[deleteLast] currentInput before:', state.currentInput);
  if (state.shouldResetInput || state.currentInput.startsWith('Error') || state.currentInput === 'Overflow' || state.currentInput === 'Undefined') {
    clearCalculator();
    return;
  }

  if (state.currentInput.length <= 1 || (state.currentInput.length === 2 && state.currentInput.startsWith('-'))) {
    state.currentInput = '0';
  } else {
    state.currentInput = state.currentInput.slice(0, -1);
  }

  console.log('[deleteLast] currentInput after:', state.currentInput);
  updateDisplay();
}

function toggleSign() {
  console.log('[toggleSign] before:', state.currentInput);
  if (state.currentInput === '0' || state.currentInput.startsWith('Error') || state.currentInput === 'Overflow' || state.currentInput === 'Undefined') {
    console.warn('[toggleSign] Cannot toggle');
    return;
  }

  state.currentInput = state.currentInput.startsWith('-') ? state.currentInput.slice(1) : '-' + state.currentInput;
  console.log('[toggleSign] after:', state.currentInput);
  updateDisplay();
}

function calculatePercentage() {
  console.log('[calculatePercentage] currentInput:', state.currentInput, '| operator:', state.operator, '| previous:', state.previousInput);
  if (state.currentInput.startsWith('Error') || state.currentInput === 'Overflow' || state.currentInput === 'Undefined') {
    console.warn('[calculatePercentage] Invalid state');
    return;
  }

  const val = parseFloat(state.currentInput);
  if (isNaN(val)) {
    console.warn('[calculatePercentage] NaN value');
    return;
  }

  let result;
  if (state.operator !== null && state.previousInput !== '') {
    const base = parseFloat(state.previousInput);
    result = parseFloat(((base * val) / 100).toPrecision(12));
    console.log('[calculatePercentage] % of base', base, ':', result);
  } else {
    result = parseFloat((val / 100).toPrecision(12));
    console.log('[calculatePercentage] Simple %:', result);
  }

  state.currentInput = String(result);
  updateDisplay();
}

function handleScientific(action) {
  console.log('[handleScientific] action:', action, '| currentInput:', state.currentInput);
  if (action === 'pi') {
    state.currentInput = String(Math.PI);
    state.shouldResetInput = false;
    console.log('[handleScientific] Inserted π:', Math.PI);
    updateDisplay();
    return;
  }
  if (action === 'e') {
    state.currentInput = String(Math.E);
    state.shouldResetInput = false;
    console.log('[handleScientific] Inserted e:', Math.E);
    updateDisplay();
    return;
  }
  if (action === 'power') {
    console.log('[handleScientific] xʸ → delegating to inputOperator');
    inputOperator('xʸ');
    return;
  }

  const val = parseFloat(state.currentInput);
  if (isNaN(val)) {
    console.error('[handleScientific] NaN value');
    showError('Error');
    return;
  }

  let result, exprStr;
  switch (action) {
    case 'sin':
      result = Math.sin(degToRad(val));
      exprStr = `sin(${formatDisplayNumber(state.currentInput)})`;
      console.log('[handleScientific] sin =', result);
      break;
    case 'cos':
      result = Math.cos(degToRad(val));
      exprStr = `cos(${formatDisplayNumber(state.currentInput)})`;
      console.log('[handleScientific] cos =', result);
      break;
    case 'tan':
      if (Math.abs(val % 180) === 90) {
        console.error('[handleScientific] tan undefined');
        showError('Undefined');
        return;
      }
      result = Math.tan(degToRad(val));
      exprStr = `tan(${formatDisplayNumber(state.currentInput)})`;
      console.log('[handleScientific] tan =', result);
      break;
    case 'sqrt':
      if (val < 0) {
        console.error('[handleScientific] sqrt of -');
        showError('Error: √ of −');
        return;
      }
      result = Math.sqrt(val);
      exprStr = `√(${formatDisplayNumber(state.currentInput)})`;
      console.log('[handleScientific] √ =', result);
      break;
    case 'square':
      result = val * val;
      exprStr = `${formatDisplayNumber(state.currentInput)}²`;
      console.log('[handleScientific] square =', result);
      break;
    case 'log':
      if (val <= 0) {
        console.error('[handleScientific] log(≤0)');
        showError('Error: log(≤0)');
        return;
      }
      result = Math.log10(val);
      exprStr = `log(${formatDisplayNumber(state.currentInput)})`;
      console.log('[handleScientific] log10 =', result);
      break;
    case 'ln':
      if (val <= 0) {
        console.error('[handleScientific] ln(≤0)');
        showError('Error: ln(≤0)');
        return;
      }
      result = Math.log(val);
      exprStr = `ln(${formatDisplayNumber(state.currentInput)})`;
      console.log('[handleScientific] ln =', result);
      break;
    default:
      console.error('[handleScientific] Unknown action:', action);
      return;
  }

  if (!isFinite(result) || isNaN(result)) {
    console.error('[handleScientific] Invalid result');
    showError('Error');
    return;
  }

  result = parseFloat(result.toPrecision(12));
  console.log('[handleScientific] Final result:', result);

  addHistory(exprStr, String(result));
  state.currentInput = String(result);
  state.shouldResetInput = true;
  state.justCalculated = true;
  updateDisplay();
}

function degToRad(deg) {
  const rad = deg * (Math.PI / 180);
  console.log('[degToRad]', deg, 'deg =', rad, 'rad');
  return rad;
}

function updateMemoryUI() {
  console.log('[updateMemoryUI] memory:', state.memory);
  if (state.memory !== 0) {
    memIndicator.classList.add('is-visible');
  } else {
    memIndicator.classList.remove('is-visible');
  }
}

function memoryClear() {
  console.log('[memoryClear] Was:', state.memory);
  state.memory = 0;
  updateMemoryUI();
}

function memoryRecall() {
  console.log('[memoryRecall] Recalling:', state.memory);
  if (state.memory === 0) {
    console.warn('[memoryRecall] Memory empty');
    return;
  }
  state.currentInput = String(state.memory);
  state.shouldResetInput = true;
  state.justCalculated = false;
  updateDisplay();
}

function memoryAdd() {
  const val = parseFloat(state.currentInput);
  if (isNaN(val)) {
    console.warn('[memoryAdd] NaN, skipping');
    return;
  }
  state.memory = parseFloat((state.memory + val).toPrecision(12));
  console.log('[memoryAdd] Added', val, '→', state.memory);
  updateMemoryUI();
}

function memorySubtract() {
  const val = parseFloat(state.currentInput);
  if (isNaN(val)) {
    console.warn('[memorySubtract] NaN, skipping');
    return;
  }
  state.memory = parseFloat((state.memory - val).toPrecision(12));
  console.log('[memorySubtract] Subtracted', val, '→', state.memory);
  updateMemoryUI();
}

function addHistory(expression, result) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  console.log('[addHistory]', expression, '=', result, 'at', time);
  state.history.unshift({ expression, result, time });
  if (state.history.length > 50) {
    state.history.pop();
    console.log('[addHistory] Capped at 50');
  }
  renderHistory();
}

function renderHistory() {
  console.log('[renderHistory] Rendering', state.history.length, 'items');
  historyList.querySelectorAll('.history-card').forEach(el => el.remove());

  if (state.history.length === 0) {
    historyEmpty.style.display = 'flex';
    console.log('[renderHistory] Empty state');
    return;
  }

  historyEmpty.style.display = 'none';
  state.history.forEach((entry, index) => {
    const card = document.createElement('div');
    card.className = `history-card ${index === 0 ? 'history-card--latest' : ''}`;
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${entry.expression} equals ${entry.result}. Press to recall.`);
    card.innerHTML = `
      <div class="history-card__top">
        <span class="history-card__expr">${escapeHtml(entry.expression)}</span>
        <span class="history-card__time">${escapeHtml(entry.time || '')}</span>
      </div>
      <div class="history-card__result">= ${escapeHtml(entry.result)}</div>
    `;

    const recall = () => recallHistory(index);
    card.addEventListener('click', recall);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        recall();
      }
    });

    historyList.appendChild(card);
    console.log('[renderHistory] Rendered index:', index);
  });
}

function recallHistory(index) {
  console.log('[recallHistory] index:', index, '→', state.history[index]);
  const entry = state.history[index];
  if (!entry) {
    console.error('[recallHistory] No entry');
    return;
  }
  state.currentInput = entry.result;
  state.previousInput = '';
  state.operator = null;
  state.shouldResetInput = true;
  state.justCalculated = true;
  highlightOperator(null);
  updateDisplay();
}

function clearHistory() {
  console.log('[clearHistory] Cleared');
  state.history = [];
  renderHistory();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setScientificMode(open) {
  console.log('[setScientificMode] open:', open);
  if (open) {
    sciPanel.classList.add('is-open');
    sciToggleBtn.classList.add('is-open');
    sciToggleBtn.setAttribute('aria-expanded', 'true');
    sciPanel.setAttribute('aria-hidden', 'false');
    if (modeScientificBtn) {
      modeScientificBtn.classList.add('is-active');
      modeScientificBtn.setAttribute('aria-selected', 'true');
    }
    if (modeStandardBtn) {
      modeStandardBtn.classList.remove('is-active');
      modeStandardBtn.setAttribute('aria-selected', 'false');
    }
    if (modeBadge) modeBadge.textContent = 'SCIENTIFIC';
  } else {
    sciPanel.classList.remove('is-open');
    sciToggleBtn.classList.remove('is-open');
    sciToggleBtn.setAttribute('aria-expanded', 'false');
    sciPanel.setAttribute('aria-hidden', 'true');
    if (modeStandardBtn) {
      modeStandardBtn.classList.add('is-active');
      modeStandardBtn.setAttribute('aria-selected', 'true');
    }
    if (modeScientificBtn) {
      modeScientificBtn.classList.remove('is-active');
      modeScientificBtn.setAttribute('aria-selected', 'false');
    }
    if (modeBadge) modeBadge.textContent = 'STANDARD';
  }
}

function toggleScientific() {
  const isOpen = sciPanel.classList.contains('is-open');
  setScientificMode(!isOpen);
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  console.log('[toggleTheme] Switching to', next);

  html.setAttribute('data-theme', next);

  const icon = themeToggleBtn.querySelector('.theme-icon');
  const label = themeToggleBtn.querySelector('.theme-label');
  if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
  if (label) label.textContent = next === 'dark' ? 'Dark' : 'Light';
  themeToggleBtn.setAttribute('aria-label', `Switch to ${isDark ? 'dark' : 'light'} mode`);

  try {
    localStorage.setItem('calcula-theme', next);
    console.log('[toggleTheme] Saved:', next);
  } catch (err) {
    console.warn('[toggleTheme] localStorage error:', err.message);
  }
}

function loadTheme() {
  try {
    const saved = localStorage.getItem('calcula-theme') || 'light';
    console.log('[loadTheme] Theme preference:', saved);
    document.documentElement.setAttribute('data-theme', saved);
    const icon = themeToggleBtn.querySelector('.theme-icon');
    const label = themeToggleBtn.querySelector('.theme-label');
    if (icon) icon.textContent = saved === 'dark' ? '🌙' : '☀️';
    if (label) label.textContent = saved === 'dark' ? 'Dark' : 'Light';
    themeToggleBtn.setAttribute('aria-label', `Switch to ${saved === 'dark' ? 'light' : 'dark'} mode`);
  } catch (err) {
    console.warn('[loadTheme] localStorage error:', err.message);
  }
}

function handleKeyboard(e) {
  if (e.target.closest('.history-card')) return;
  const key = e.key;
  console.log('[handleKeyboard] key:', key);

  if (key >= '0' && key <= '9') {
    e.preventDefault();
    inputNumber(key);
    animateKeyPress(key);
    return;
  }

  switch (key) {
    case '.':
    case ',':
      e.preventDefault();
      inputDecimal();
      animateKeyPress('.');
      break;
    case '+':
      e.preventDefault();
      inputOperator('+');
      break;
    case '-':
      e.preventDefault();
      inputOperator('−');
      break;
    case '*':
      e.preventDefault();
      inputOperator('×');
      break;
    case '/':
      e.preventDefault();
      inputOperator('÷');
      break;
    case 'Enter':
    case '=':
      e.preventDefault();
      calculate();
      animateKeyPress('=');
      break;
    case 'Backspace':
      e.preventDefault();
      deleteLast();
      break;
    case 'Escape':
      e.preventDefault();
      clearCalculator();
      break;
    case '%':
      e.preventDefault();
      calculatePercentage();
      break;
  }
}

function animateKeyPress(keyChar) {
  console.log('[animateKeyPress] key:', keyChar);
  let selector = null;
  if (!isNaN(Number(keyChar))) {
    selector = `[data-action="number"][data-value="${keyChar}"]`;
  } else if (keyChar === '.') {
    selector = '[data-action="decimal"]';
  } else if (keyChar === '=') {
    selector = '[data-action="equals"]';
  }

  if (!selector) return;
  const btn = document.querySelector(selector);
  if (!btn) {
    console.warn('[animateKeyPress] Not found:', selector);
    return;
  }

  btn.classList.add('btn--pressed');
  setTimeout(() => btn.classList.remove('btn--pressed'), 200);
}

function attachButtonListeners() {
  console.log('[attachButtonListeners] Binding main content clicks');
  document.querySelector('.main-content').addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;
    console.log('[click] action:', action, 'value:', value);

    switch (action) {
      case 'number': inputNumber(value); break;
      case 'decimal': inputDecimal(); break;
      case 'operator': inputOperator(value); break;
      case 'equals': calculate(); break;
      case 'clear': clearCalculator(); break;
      case 'backspace': deleteLast(); break;
      case 'sign': toggleSign(); break;
      case 'percent': calculatePercentage(); break;
      case 'memory-clear': memoryClear(); break;
      case 'memory-recall': memoryRecall(); break;
      case 'memory-add': memoryAdd(); break;
      case 'memory-subtract': memorySubtract(); break;
      case 'sin': case 'cos': case 'tan': case 'sqrt': case 'square':
      case 'power': case 'log': case 'ln': case 'pi': case 'e':
        handleScientific(action);
        break;
      default: console.warn('[click] Unhandled:', action);
    }
  });
}

function attachControlListeners() {
  console.log('[attachControlListeners] Binding controls');
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
  if (sciToggleBtn) sciToggleBtn.addEventListener('click', toggleScientific);
  if (modeStandardBtn) modeStandardBtn.addEventListener('click', () => setScientificMode(false));
  if (modeScientificBtn) modeScientificBtn.addEventListener('click', () => setScientificMode(true));
  document.addEventListener('keydown', handleKeyboard);
}

(function init() {
  console.log('[init] CALCULA starting');
  loadTheme();
  attachButtonListeners();
  attachControlListeners();
  updateDisplay();
  updateMemoryUI();
  renderHistory();
  console.log('[init] CALCULA ready');
})();
