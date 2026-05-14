import React, { useState, useEffect } from 'react';
import { Zap, Clock, HardDrive, Settings, Power } from 'lucide-react';

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
          if (currentTabIds.has(id) && state?.isSuspended) {
            validTabStates[id] = state;
            suspendedCount++;
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

  return (
    <div className="w-72 bg-[#020617] text-slate-100 font-sans">
      <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white w-4 h-4 fill-white" />
          </div>
          <span className="font-bold">Tab Freeze Frame</span>
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
              <span className="text-xs text-slate-400">已挂起</span>
            </div>
            <div className="text-2xl font-bold">{stats.suspendedCount}</div>
            <div className="text-xs text-slate-500">标签页</div>
          </div>

          <div className="bg-slate-800/50 border border-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">已释放</span>
            </div>
            <div className="text-2xl font-bold">~{stats.memorySaved}</div>
            <div className="text-xs text-slate-500">MB 内存</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5" />
                运行中
              </div>
              <div className="text-xs text-blue-200/70 mt-0.5">自动监测闲置标签</div>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>

        <button
          onClick={() => window.open('options.html', '_blank')}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          设置超时时间
        </button>
      </div>
    </div>
  );
}
