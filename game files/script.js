// Sentence pools (same as your Java arrays)
const EASY_TEXTS = [
  "The quick brown fox jumps over the lazy dog.",
  "Java is fun. Learn typing fast.",
  "Practice makes perfect. Stay consistent.",
  "She always brings her lunch to school",
  "I enjoy reading books on quiet evenings",
  "The little boy kicked the red football",
  "They went shopping at the local market",
  "My sister loves playing the piano daily",
  "We should finish homework before watching TV",
  "He drinks coffee every morning before work",
  "The teacher explained the lesson very clearly",
  "Birds were flying high above the trees"
];

const MEDIUM_TEXTS = [
  "Software development involves planning and testing.",
  "Focus on accuracy before aiming for speed.",
  "Applications rely on efficient algorithms."
];

const HARD_TEXTS = [
  "Cybersecurity protects sensitive data from attacks.",
  "Distributed systems handle latency and failures.",
  "Machine learning models need regular tuning."
];

// DOM
const targetEl = document.getElementById('target');
const inputEl = document.getElementById('input');
const levelEl = document.getElementById('level');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('startBtn');
const historyBtn = document.getElementById('historyBtn');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('acc');
const resultEl = document.getElementById('result');

const historyModal = document.getElementById('historyModal');
const historyListEl = document.getElementById('historyList');
const closeHistory = document.getElementById('closeHistory');
const clearHistory = document.getElementById('clearHistory');

let sentencePool = [];
let currentText = '';
let timer = null;
let timeLeft = 0;
let startTime = 0;
let totalTyped = 0;
let totalCorrect = 0;
let sentenceComplete = false;
let history = loadHistory();

// Utility: pick pool
function buildPool(level) {
  if (level === 'Medium') return [...MEDIUM_TEXTS];
  if (level === 'Hard') return [...HARD_TEXTS];
  return [...EASY_TEXTS];
}

// choose next sentence
function nextSentence() {
  sentenceComplete = false;
  inputEl.value = '';        // clear typed input
  const idx = Math.floor(Math.random() * sentencePool.length);
  currentText = sentencePool[idx];
  renderTarget();             // render clean neutral text
  inputEl.focus();
}


// render target with spans for highlighting
function renderTarget() {
  const typed = inputEl.value || '';
  let html = '';

  for (let i = 0; i < currentText.length; i++) {
    const ch = currentText[i];
    const typedChar = typed[i];

    if (typedChar === undefined) {
      // not typed yet -> neutral
      html += `<span>${escapeHtml(ch)}</span>`;
    } else if (typedChar === ch) {
      // correct
      html += `<span class="correct">${escapeHtml(ch)}</span>`;
    } else {
      // wrong
      html += `<span class="wrong">${escapeHtml(ch)}</span>`;
    }
  }

  targetEl.innerHTML = html;
}



// escape helper
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// handle typing updates
inputEl.addEventListener('input', () => {
  const typed = inputEl.value;
  // update highlight
  renderTarget();

  // if typed length >= currentText length and not complete -> update counts and next
  if (!sentenceComplete && typed.length >= currentText.length) {
    sentenceComplete = true;
    totalTyped += currentText.length;
    totalCorrect += countCorrectChars(currentText, typed);
    // small delay before switching sentence so user sees full sentence
    setTimeout(nextSentence, 120);
  }
});

// count correct chars
function countCorrectChars(expected, typed) {
  let c = 0;
  for (let i = 0; i < Math.min(expected.length, typed.length); i++) {
    if (expected[i] === typed[i]) c++;
  }
  return c;
}

// start test sequence
startBtn.addEventListener('click', () => {
  startCountdown(3);
});

function startCountdown(seconds) {
  // disable controls
  startBtn.disabled = true;
  levelEl.disabled = true;
  timeEl.disabled = true;
  inputEl.disabled = true;
  targetEl.textContent = `Starting in ${seconds}...`;
  let sec = seconds;
  const cd = setInterval(() => {
    sec--;
    if (sec > 0) {
      targetEl.textContent = `Starting in ${sec}...`;
    } else {
      clearInterval(cd);
      beginTest();
    }
  }, 1000);
}

function beginTest() {
  // initialize
  timeLeft = parseInt(timeEl.value, 10);
  timerEl.textContent = `Time: ${timeLeft}s`;
  wpmEl.textContent = 'WPM: --';
  accEl.textContent = 'Accuracy: --';
  totalTyped = 0;
  totalCorrect = 0;
  sentencePool = buildPool(levelEl.value);
  nextSentence();
  startTime = Date.now();
  inputEl.disabled = false;
  inputEl.focus();

  // every second update time and live stats
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}s`;
    updateLiveStats(false);
    if (timeLeft <= 0) {
      endTest();
    }
  }, 1000);
}

// live stats
function updateLiveStats(force) {
  const elapsedMs = Date.now() - startTime;
  if (elapsedMs < 500) return;
  const minutes = elapsedMs / 60000;
  const nowTyped = inputEl.value.length;
  const nowCorrect = countCorrectChars(currentText, inputEl.value);
  // compute totals including current in-progress sentence
  const finalTotalTyped = totalTyped + nowTyped;
  const finalTotalCorrect = totalCorrect + nowCorrect;
  const wpm = minutes > 0 ? (finalTotalCorrect / 5) / minutes : 0;
  const accuracy = finalTotalTyped > 0 ? (finalTotalCorrect * 100 / finalTotalTyped) : 100;
  wpmEl.textContent = `WPM: ${wpm.toFixed(1)}`;
  accEl.textContent = `Accuracy: ${accuracy.toFixed(1)}%`;
}

// end test
function endTest() {
  clearInterval(timer);
  inputEl.disabled = true;
  updateLiveStats(true);
  // final compute using elapsed time
  const elapsedMs = Date.now() - startTime;
  const minutes = Math.max(elapsedMs / 60000, 1 / 60); // avoid zero
  const nowTyped = inputEl.value.length;
  const nowCorrect = countCorrectChars(currentText, inputEl.value);
  const finalTotalTyped = totalTyped + nowTyped;
  const finalTotalCorrect = totalCorrect + nowCorrect;
  const wpm = (finalTotalCorrect / 5) / minutes;
  const accuracy = finalTotalTyped > 0 ? (finalTotalCorrect * 100 / finalTotalTyped) : 100;

  // show result nicely
  resultEl.hidden = false;
  resultEl.innerHTML = `Time's Up! &nbsp; <strong>WPM:</strong> ${wpm.toFixed(1)} &nbsp; <strong>Accuracy:</strong> ${accuracy.toFixed(1)}%`;

  // save to history
  const entry = {
    wpm: Number(wpm.toFixed(1)),
    accuracy: Number(accuracy.toFixed(1)),
    time: Math.round(elapsedMs / 1000),
    difficulty: levelEl.value,
    date: new Date().toISOString()
  };
  history.push(entry);
  saveHistory();

  // reset UI controls after a short delay
  setTimeout(() => {
    startBtn.disabled = false;
    levelEl.disabled = false;
    timeEl.disabled = false;
  }, 300);

}

// history (localStorage)
function loadHistory() {
  try {
    const raw = localStorage.getItem('tsp_history_v1');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) { return []; }
}

function saveHistory() {
  try {
    localStorage.setItem('tsp_history_v1', JSON.stringify(history));
  } catch (e) { /* ignore */ }
}

historyBtn.addEventListener('click', () => {
  showHistory();
});

function showHistory() {
  historyModal.setAttribute('aria-hidden', 'false');
  historyModal.style.display = 'flex';
  renderHistory();
}
closeHistory.addEventListener('click', () => {
  historyModal.setAttribute('aria-hidden', 'true');
  historyModal.style.display = 'none';
});
clearHistory.addEventListener('click', () => {
  if (confirm('Clear saved history?')) {
    history = [];
    saveHistory();
    renderHistory();
  }
});

function renderHistory() {
  if (history.length === 0) {
    historyListEl.innerHTML = '<div style="padding:10px;color:#98a1ad">No sessions yet.</div>';
    return;
  }
  // show latest first
  const rows = history.slice().reverse().map(h => {
    const d = new Date(h.date);
    return `<div style="padding:8px;border-bottom:1px dashed rgba(255,255,255,0.03)">
      <div><strong>WPM:</strong> ${h.wpm} &nbsp; <strong>Acc:</strong> ${h.accuracy}% &nbsp; <strong>Time:</strong> ${h.time}s</div>
      <div style="font-size:0.85rem;color:#98a1ad">${h.difficulty} • ${d.toLocaleString()}</div>
    </div>`;
  }).join('');
  historyListEl.innerHTML = rows;
}
