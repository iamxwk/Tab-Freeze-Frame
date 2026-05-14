/**
 * Tab Snap Background Service Worker
 */

interface TabState {
  lastActive: number;
  url: string;
  title: string;
  favIconUrl?: string;
  screenshot?: string;
  isSuspended?: boolean;
}

const STORAGE_KEYS = {
  TABS: 'tab_states',
  SETTINGS: 'extension_settings',
};

// Default timeout: 20 minute
const DEFAULT_TIMEOUT = 20;

// Initialize when installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: { timeoutMinutes: DEFAULT_TIMEOUT },
    [STORAGE_KEYS.TABS]: {},
  });

  // Check every minute
  chrome.alarms.create('check_idle_tabs', { periodInMinutes: 1 });
});

const captureActiveTab = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith('http')) return;

    const screenshot = await chrome.tabs.captureVisibleTab(undefined, { format: 'jpeg', quality: 50 });

    const data = await chrome.storage.local.get(STORAGE_KEYS.TABS);
    const tabStates = data[STORAGE_KEYS.TABS] || {};

    tabStates[tab.id] = {
      ...tabStates[tab.id],
      lastActive: Date.now(),
      url: tab.url,
      title: tab.title || '',
      favIconUrl: tab.favIconUrl,
      screenshot: screenshot,
      isSuspended: false
    };

    await chrome.storage.local.set({ [STORAGE_KEYS.TABS]: tabStates });
  } catch (e) {
    console.error('Snapshot failed:', e);
  }
};

const updateOrCreateTabActivity = async (tabId: number) => {
  const data = await chrome.storage.local.get(STORAGE_KEYS.TABS);
  const tabStates = data[STORAGE_KEYS.TABS] || {};

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url || !tab.url.startsWith('http')) return;

    if (tabStates[tabId]) {
      tabStates[tabId].lastActive = Date.now();
    } else {
      tabStates[tabId] = {
        lastActive: Date.now(),
        url: tab.url,
        title: tab.title || '',
        favIconUrl: tab.favIconUrl,
        isSuspended: false
      };
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.TABS]: tabStates });
  } catch {}
};

// Listeners for activity
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateOrCreateTabActivity(tabId);
  setTimeout(captureActiveTab, 2000);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    captureActiveTab();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    captureActiveTab();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'check_idle_tabs') {
    const [tabsData, settingsData] = await Promise.all([
      chrome.storage.local.get(STORAGE_KEYS.TABS),
      chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
    ]);
    const tabStates = tabsData[STORAGE_KEYS.TABS] || {};
    const settings = settingsData[STORAGE_KEYS.SETTINGS];
    const timeoutMs = (settings?.timeoutMinutes || DEFAULT_TIMEOUT) * 60 * 1000;
    const whitelist = settings?.whitelist || '';
    const now = Date.now();

    const tabs = await chrome.tabs.query({ active: false });

    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      const extUrl = chrome.runtime.getURL('');
      if (tab.url.startsWith('chrome://') || tab.url.startsWith(extUrl)) continue;

      if (whitelist) {
        const patterns = whitelist.split('\n').filter(p => p.trim());
        const isWhitelisted = patterns.some(pattern => {
          try {
            const regex = new RegExp(pattern.trim());
            return regex.test(tab.url);
          } catch {
            return false;
          }
        });
        if (isWhitelisted) continue;
      }

      const state = tabStates[tab.id];
      const lastActive = state?.lastActive || 0;

      if (lastActive > 0 && (now - lastActive) > timeoutMs) {
        const suspendedUrl = `${extUrl}suspended.html?tabId=${tab.id}&url=${encodeURIComponent(tab.url)}`;

        tabStates[tab.id] = {
          ...state,
          url: tab.url,
          title: tab.title || '',
          favIconUrl: tab.favIconUrl,
          lastActive: now,
          isSuspended: true
        };

        await chrome.storage.local.set({ [STORAGE_KEYS.TABS]: tabStates });
        try {
          await chrome.tabs.update(tab.id, { url: suspendedUrl });
        } catch (e) {
        }
      }
    }
  }
});

// Cleanup when tab is closed
let pendingRemovals: number[] = [];
let removalTimeout: ReturnType<typeof setTimeout> | null = null;

const flushRemovals = async () => {
  if (pendingRemovals.length === 0) return;
  const toRemove = [...pendingRemovals];
  pendingRemovals = [];
  const data = await chrome.storage.local.get(STORAGE_KEYS.TABS);
  const tabStates = data[STORAGE_KEYS.TABS] || {};
  for (const tabId of toRemove) {
    delete tabStates[tabId];
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.TABS]: tabStates });
};

chrome.tabs.onRemoved.addListener((tabId) => {
  pendingRemovals.push(tabId);
  if (removalTimeout) clearTimeout(removalTimeout);
  removalTimeout = setTimeout(flushRemovals, 100);
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.action === 'freezeTab') {
    const { tabId, url, title, favIconUrl } = message;

    setTimeout(async () => {
      let screenshot;
      try {
        screenshot = await chrome.tabs.captureVisibleTab(undefined, { format: 'jpeg', quality: 50 });
      } catch {}

      const extUrl = chrome.runtime.getURL('');
      const suspendedUrl = `${extUrl}suspended.html?tabId=${tabId}&url=${encodeURIComponent(url)}`;

      const data = await chrome.storage.local.get(STORAGE_KEYS.TABS);
      const tabStates = data[STORAGE_KEYS.TABS] || {};

      tabStates[tabId] = {
        ...tabStates[tabId],
        url,
        title,
        favIconUrl,
        screenshot: screenshot || tabStates[tabId]?.screenshot,
        lastActive: Date.now(),
        isSuspended: true
      };

      await chrome.storage.local.set({ [STORAGE_KEYS.TABS]: tabStates });
      try {
        await chrome.tabs.update(tabId, { url: suspendedUrl });
      } catch {}
    }, 100);
  }
});
