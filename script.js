
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


function buildPool(level) {
  if (level === 'Medium') return [...MEDIUM_TEXTS];
  if (level === 'Hard') return [...HARD_TEXTS];
  return [...EASY_TEXTS];
}


function nextSentence() {
  sentenceComplete = false;
  inputEl.value = '';       
  const idx = Math.floor(Math.random() * sentencePool.length);
  currentText = sentencePool[idx];
  renderTarget();            
  inputEl.focus();
}



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
     
      html += `<span class="correct">${escapeHtml(ch)}</span>`;
    } else {
    
      html += `<span class="wrong">${escapeHtml(ch)}</span>`;
    }
  }

  targetEl.innerHTML = html;
}




function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


inputEl.addEventListener('input', () => {
  const typed = inputEl.value;

  renderTarget();

  
  if (!sentenceComplete && typed.length >= currentText.length) {
    sentenceComplete = true;
    totalTyped += currentText.length;
    totalCorrect += countCorrectChars(currentText, typed);
  
    setTimeout(nextSentence, 120);
  }
});


function countCorrectChars(expected, typed) {
  let c = 0;
  for (let i = 0; i < Math.min(expected.length, typed.length); i++) {
    if (expected[i] === typed[i]) c++;
  }
  return c;
}


startBtn.addEventListener('click', () => {
  startCountdown(3);
});

function startCountdown(seconds) {
  
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

  
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}s`;
    updateLiveStats(false);
    if (timeLeft <= 0) {
      endTest();
    }
  }, 1000);
}


function updateLiveStats(force) {
  const elapsedMs = Date.now() - startTime;
  if (elapsedMs < 500) return;
  const minutes = elapsedMs / 60000;
  const nowTyped = inputEl.value.length;
  const nowCorrect = countCorrectChars(currentText, inputEl.value);
  
  const finalTotalTyped = totalTyped + nowTyped;
  const finalTotalCorrect = totalCorrect + nowCorrect;
  const wpm = minutes > 0 ? (finalTotalCorrect / 5) / minutes : 0;
  const accuracy = finalTotalTyped > 0 ? (finalTotalCorrect * 100 / finalTotalTyped) : 100;
  wpmEl.textContent = `WPM: ${wpm.toFixed(1)}`;
  accEl.textContent = `Accuracy: ${accuracy.toFixed(1)}%`;
}


function endTest() {
  clearInterval(timer);
  inputEl.disabled = true;
  updateLiveStats(true);
  
  const elapsedMs = Date.now() - startTime;
  const minutes = Math.max(elapsedMs / 60000, 1 / 60);
  const nowTyped = inputEl.value.length;
  const nowCorrect = countCorrectChars(currentText, inputEl.value);
  const finalTotalTyped = totalTyped + nowTyped;
  const finalTotalCorrect = totalCorrect + nowCorrect;
  const wpm = (finalTotalCorrect / 5) / minutes;
  const accuracy = finalTotalTyped > 0 ? (finalTotalCorrect * 100 / finalTotalTyped) : 100;

  
  resultEl.hidden = false;
  resultEl.innerHTML = `Time's Up! &nbsp; <strong>WPM:</strong> ${wpm.toFixed(1)} &nbsp; <strong>Accuracy:</strong> ${accuracy.toFixed(1)}%`;

  
  const entry = {
    wpm: Number(wpm.toFixed(1)),
    accuracy: Number(accuracy.toFixed(1)),
    time: Math.round(elapsedMs / 1000),
    difficulty: levelEl.value,
    date: new Date().toISOString()
  };
  history.push(entry);
  saveHistory();


  setTimeout(() => {
    startBtn.disabled = false;
    levelEl.disabled = false;
    timeEl.disabled = false;
  }, 300);

}


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
  } catch (e) {  }
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
  
  const rows = history.slice().reverse().map(h => {
    const d = new Date(h.date);
    return `<div style="padding:8px;border-bottom:1px dashed rgba(255,255,255,0.03)">
      <div><strong>WPM:</strong> ${h.wpm} &nbsp; <strong>Acc:</strong> ${h.accuracy}% &nbsp; <strong>Time:</strong> ${h.time}s</div>
      <div style="font-size:0.85rem;color:#98a1ad">${h.difficulty} • ${d.toLocaleString()}</div>
    </div>`;
  }).join('');
  historyListEl.innerHTML = rows;
}
