import React, { useState, useEffect } from 'react';
import { Clock, HardDrive, Settings, Power, Zap } from 'lucide-react';
import { i18n } from './utils/i18n';

export default function App() {
  const [stats, setStats] = useState({
    suspendedCount: 0,
    memorySaved: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const tabs = await chrome.tabs.query({});
        const currentTabIds = new Set(tabs.map(t => t.id));

        const data = await chrome.storage.local.get('tab_states');
        const tabStates = data.tab_states || {};
        const validTabStates: Record<number, typeof tabStates[string]> = {};

        let suspendedCount = 0;
        for (const [tabId, state] of Object.entries(tabStates)) {
          const id = parseInt(tabId);
          if (currentTabIds.has(id)) {
            validTabStates[id] = state;
            if (state?.isSuspended) {
              suspendedCount++;
            }
          }
        }

        await chrome.storage.local.set({ tab_states: validTabStates });

        setStats({
          suspendedCount,
          memorySaved: suspendedCount * 50,
        });
      } catch {
        setStats({ suspendedCount: 0, memorySaved: 0 });
      }
    }

    loadStats();
  }, []);

  const handleFreezeCurrent = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url?.startsWith('http')) return;

      window.close();
      chrome.runtime.sendMessage({
        action: 'freezeTab',
        tabId: tab.id,
        url: tab.url,
        title: tab.title || '',
        favIconUrl: tab.favIconUrl
      });
    } catch {}
  };

  return (
    <div className="w-72 bg-[#020617] text-slate-100 font-sans">
      <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="icon.png" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-bold">{i18n('extension_name')}</span>
        </div>
        <button
          onClick={() => window.open('options.html', '_blank')}
          className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">{i18n('popup_suspended')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.suspendedCount}</div>
            <div className="text-xs text-slate-500">{i18n('popup_tabs')}</div>
          </div>

          <div className="bg-slate-800/50 border border-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">{i18n('popup_released')}</span>
            </div>
            <div className="text-2xl font-bold">~{stats.memorySaved}</div>
            <div className="text-xs text-slate-500">{i18n('popup_memory')}</div>
          </div>
        </div>

        <button
          onClick={handleFreezeCurrent}
          className="w-full bg-[#569ac4] hover:bg-[#4a8ab4] text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {i18n('popup_freeze_now')}
        </button>
      </div>
    </div>
  );
}
