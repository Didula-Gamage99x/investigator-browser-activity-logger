// background.js
// Logs every committed navigation in your own browser to local storage.
// Detects search queries from common search engines' URL parameters.

const MAX_ENTRIES = 5000;

const SEARCH_ENGINES = [
  { match: "google.", param: "q" },
  { match: "bing.com", param: "q" },
  { match: "duckduckgo.com", param: "q" },
  { match: "search.yahoo.com", param: "p" },
  { match: "youtube.com/results", param: "search_query" },
  { match: "baidu.com", param: "wd" },
  { match: "ecosia.org", param: "q" }
];

function extractSearchQuery(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname + url.pathname;
    for (const engine of SEARCH_ENGINES) {
      if (host.includes(engine.match)) {
        const q = url.searchParams.get(engine.param);
        if (q) return q;
      }
    }
  } catch (e) {
    // ignore malformed URLs
  }
  return null;
}

async function addEntry(entry) {
  const data = await chrome.storage.local.get({ logs: [] });
  const logs = data.logs;
  logs.push(entry);
  if (logs.length > MAX_ENTRIES) {
    logs.splice(0, logs.length - MAX_ENTRIES);
  }
  await chrome.storage.local.set({ logs });
}

chrome.webNavigation.onCommitted.addListener((details) => {
  // Only top-level frame navigations, skip background/iframe noise
  if (details.frameId !== 0) return;
  if (!details.url || !details.url.startsWith("http")) return;

  const query = extractSearchQuery(details.url);

  const entry = {
    timestamp: Date.now(),
    url: details.url,
    type: query ? "search" : "visit",
    query: query || null,
    title: null
  };

  addEntry(entry);

  // Try to grab the page title shortly after load completes
  if (details.tabId !== undefined && details.tabId >= 0) {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
      if (tabId === details.tabId && changeInfo.status === "complete" && tab.url === details.url) {
        chrome.tabs.get(tabId, (t) => {
          if (t && t.title) {
            updateLastEntryTitle(details.url, t.title);
          }
        });
        chrome.tabs.onUpdated.removeListener(listener);
      }
    });
  }
});

async function updateLastEntryTitle(url, title) {
  const data = await chrome.storage.local.get({ logs: [] });
  const logs = data.logs;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].url === url && !logs[i].title) {
      logs[i].title = title;
      break;
    }
  }
  await chrome.storage.local.set({ logs });
}

// ---- Automatic backups ----
// Every 30 minutes, silently save a copy of the log to the Downloads folder.
// This means even if someone clears the in-extension log, earlier backups remain on disk.

const BACKUP_FOLDER = "ActivityLogBackups";

chrome.alarms.create("backup", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "backup") {
    runBackup();
  }
});

async function runBackup() {
  const data = await chrome.storage.local.get({ logs: [] });
  if (!data.logs || data.logs.length === 0) return;

  const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const filename = `${BACKUP_FOLDER}/activity-backup-${Date.now()}.json`;

  chrome.downloads.download(
    {
      url,
      filename,
      conflictAction: "uniquify",
      saveAs: false
    },
    () => {
      // Release the blob URL after the download is handed off
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  );
}

// Run one backup shortly after the browser starts, in addition to the recurring alarm
chrome.runtime.onStartup.addListener(() => {
  setTimeout(runBackup, 10000);
});
