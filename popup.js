// popup.js

const lockScreen = document.getElementById("lock-screen");
const reportView = document.getElementById("report-view");
const passInput = document.getElementById("passInput");
const passConfirm = document.getElementById("passConfirm");
const unlockBtn = document.getElementById("unlockBtn");
const lockError = document.getElementById("lock-error");
const lockInstructions = document.getElementById("lock-instructions");

const listEl = document.getElementById("log-list");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count");
const filterInput = document.getElementById("filterInput");

let allLogs = [];

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function init() {
  const data = await chrome.storage.local.get({ passHash: null });
  if (!data.passHash) {
    lockInstructions.textContent = "Set a passcode to protect this report";
    passConfirm.style.display = "block";
    unlockBtn.textContent = "Set passcode";
    unlockBtn.onclick = setupPasscode;
  } else {
    lockInstructions.textContent = "Enter passcode to view this report";
    unlockBtn.textContent = "Unlock";
    unlockBtn.onclick = checkPasscode;
  }
}

async function setupPasscode() {
  const p1 = passInput.value;
  const p2 = passConfirm.value;
  if (!p1 || p1.length < 4) {
    lockError.textContent = "Passcode must be at least 4 characters.";
    return;
  }
  if (p1 !== p2) {
    lockError.textContent = "Passcodes do not match.";
    return;
  }
  const hash = await sha256(p1);
  await chrome.storage.local.set({ passHash: hash });
  unlockReport();
}

async function checkPasscode() {
  const entered = passInput.value;
  const data = await chrome.storage.local.get({ passHash: null });
  const hash = await sha256(entered);
  if (hash === data.passHash) {
    unlockReport();
  } else {
    lockError.textContent = "Incorrect passcode.";
  }
}

function unlockReport() {
  lockScreen.style.display = "none";
  reportView.style.display = "block";
  passInput.value = "";
  passConfirm.value = "";
  lockError.textContent = "";
  loadLogs();
}

function lockReport() {
  reportView.style.display = "none";
  lockScreen.style.display = "block";
  lockInstructions.textContent = "Enter passcode to view this report";
  passConfirm.style.display = "none";
  unlockBtn.textContent = "Unlock";
  unlockBtn.onclick = checkPasscode;
}

document.getElementById("lockBtn").addEventListener("click", lockReport);

function formatTime(ts) {
  return new Date(ts).toLocaleString();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function render(logs) {
  listEl.innerHTML = "";
  if (logs.length === 0) {
    emptyEl.style.display = "block";
    listEl.style.display = "none";
    return;
  }
  emptyEl.style.display = "none";
  listEl.style.display = "block";

  const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  for (const entry of sorted) {
    const div = document.createElement("div");
    div.className = "entry";

    const displayTitle = entry.type === "search"
      ? `Searched: "${entry.query}"`
      : (entry.title || entry.url);

    div.innerHTML = `
      <div class="top">
        <span class="title">${escapeHtml(displayTitle)}</span>
        <span class="badge ${entry.type}">${entry.type}</span>
      </div>
      <div class="url">${escapeHtml(entry.url)}</div>
      <div class="time">${formatTime(entry.timestamp)}</div>
    `;
    listEl.appendChild(div);
  }
}

function applyFilter() {
  const term = filterInput.value.trim().toLowerCase();
  if (!term) {
    render(allLogs);
    countEl.textContent = `${allLogs.length} entries`;
    return;
  }
  const filtered = allLogs.filter((e) =>
    (e.url && e.url.toLowerCase().includes(term)) ||
    (e.title && e.title.toLowerCase().includes(term)) ||
    (e.query && e.query.toLowerCase().includes(term))
  );
  render(filtered);
  countEl.textContent = `${filtered.length} of ${allLogs.length} entries`;
}

async function loadLogs() {
  const data = await chrome.storage.local.get({ logs: [] });
  allLogs = data.logs;
  applyFilter();
}

document.getElementById("exportBtn").addEventListener("click", async () => {
  const data = await chrome.storage.local.get({ logs: [] });
  const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-log-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("clearBtn").addEventListener("click", async () => {
  if (confirm("Clear all logged activity? This cannot be undone.")) {
    await chrome.storage.local.set({ logs: [] });
    loadLogs();
  }
});

filterInput.addEventListener("input", applyFilter);

init();
