import React, { useEffect, useState, useRef } from 'react';
import { Save, Clock, ShieldCheck, Info, Globe, List, LayoutList, Timer, ChevronDown, Cog, MousePointerClick } from 'lucide-react';
import { motion } from 'motion/react';
import { i18n } from '../../utils/i18n';

interface TabState {
  lastActive: number;
  url: string;
  title: string;
  favIconUrl?: string;
  screenshot?: string;
  isSuspended?: boolean;
}

export default function OptionsPage() {
  const [timeout, setTimeoutVal] = useState(1);
  const [whitelist, setWhitelist] = useState('');
  const [allowFreezePinned, setAllowFreezePinned] = useState(false);
  const [allowFreezeMediaPlaying, setAllowFreezeMediaPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [version, setVersion] = useState('');
  const [tabStates, setTabStates] = useState<Record<number, TabState>>({});
  const [freezeCountdowns, setFreezeCountdowns] = useState<Record<number, number>>({});
  const [hoveredTab, setHoveredTab] = useState<{ tabId: number; state: TabState; x: number; y: number } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedTimeout, setSavedTimeout] = useState(1);
  const initialValues = useRef({ timeout: 1, whitelist: '', allowFreezePinned: false, allowFreezeMediaPlaying: false });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const [isIdle, setIsIdle] = useState(false);
  const isIdleRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      isIdleRef.current = true;
    }, 5 * 60 * 1000);
  };

  const wakeUp = () => {
    setIsIdle(false);
    isIdleRef.current = false;
    resetIdleTimer();
  };

  const loadTabStates = () => {
    if (chrome.storage) {
      chrome.storage.local.get('tab_states', (data) => {
        if (data.tab_states) {
          setTabStates(data.tab_states);
        }
      });
    }
  };

  useEffect(() => {
    document.title = i18n('settings_title');
    if (chrome.storage) {
      chrome.storage.local.get('extension_settings', (data) => {
        if (data.extension_settings) {
          setTimeoutVal(data.extension_settings.timeoutMinutes || 1);
          setSavedTimeout(data.extension_settings.timeoutMinutes || 1);
          setWhitelist(data.extension_settings.whitelist || '');
          setAllowFreezePinned(data.extension_settings.allowFreezePinned ?? false);
          setAllowFreezeMediaPlaying(data.extension_settings.allowFreezeMediaPlaying ?? false);
          initialValues.current = {
            timeout: data.extension_settings.timeoutMinutes || 1,
            whitelist: data.extension_settings.whitelist || '',
            allowFreezePinned: data.extension_settings.allowFreezePinned ?? false,
            allowFreezeMediaPlaying: data.extension_settings.allowFreezeMediaPlaying ?? false
          };
        }
      });
    }
    if (chrome.runtime?.getManifest()) {
      setVersion(chrome.runtime.getManifest().version || '');
    }
    loadTabStates();
    resetIdleTimer();

    const refreshInterval = setInterval(() => {
      if (!isIdleRef.current) {
        loadTabStates();
      }
    }, 3000);

    const handleActivity = () => {
      if (!isIdleRef.current) {
        resetIdleTimer();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(refreshInterval);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  useEffect(() => {
    const updateCountdowns = () => {
      if (isIdleRef.current) return;
      const newCountdowns: Record<number, number> = {};
      const activeTimeout = hasUnsavedChanges ? savedTimeout : timeout;
      Object.entries(tabStates).forEach(([tabId, state]) => {
        if (state.isSuspended) {
          newCountdowns[parseInt(tabId)] = 0;
          return;
        }
        const elapsed = Date.now() - state.lastActive;
        const timeoutMs = activeTimeout * 60 * 1000;
        const remaining = Math.max(0, timeoutMs - elapsed);
        newCountdowns[parseInt(tabId)] = remaining;
      });
      setFreezeCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [tabStates, timeout, savedTimeout, hasUnsavedChanges]);

  useEffect(() => {
    const updatePos = () => {
      if (saveButtonRef.current) {
        const rect = saveButtonRef.current.getBoundingClientRect();
        setTooltipPos({ x: rect.left, y: rect.top });
      }
    };
    if (hasUnsavedChanges) {
      updatePos();
      window.addEventListener('scroll', updatePos);
      return () => window.removeEventListener('scroll', updatePos);
    }
  }, [hasUnsavedChanges]);

  const handleSave = () => {
    if (chrome.storage) {
      chrome.storage.local.set({
        extension_settings: {
          timeoutMinutes: timeout,
          whitelist: whitelist,
          allowFreezePinned: allowFreezePinned,
          allowFreezeMediaPlaying: allowFreezeMediaPlaying
        }
      }, () => {
        setSaved(true);
        setHasUnsavedChanges(false);
        setSavedTimeout(timeout);
        initialValues.current = { timeout, whitelist, allowFreezePinned, allowFreezeMediaPlaying };
        setTimeout(() => setSaved(false), 2000);
        chrome.runtime.sendMessage({ action: 'settingsChanged' });
      });
    } else {
      setSaved(true);
      setHasUnsavedChanges(false);
      initialValues.current = { timeout, whitelist, allowFreezePinned, allowFreezeMediaPlaying };
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const formatLastActive = (timestamp: number) => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const getFreezeRemaining = (tabId: number) => {
    const remaining = freezeCountdowns[tabId];
    if (remaining === undefined) return null;
    if (remaining <= 0) return '0m 0s';
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const handleTabClick = (tabId: number) => {
    chrome.tabs.update(tabId, { active: true });
    chrome.windows.update(tabId, { focused: true });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <img src="icon.png" alt="" className="w-12 h-12 rounded-2xl shadow-lg shadow-blue-500/20" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{i18n('settings_title')}</h1>
            <p className="text-slate-500 mt-1">{i18n('settings_description')}</p>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{i18n('settings_suspend_timeout')}</h2>
                <p className="text-sm text-slate-500">{i18n('settings_timeout_desc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <input
                type="range"
                min="1"
                max="120"
                value={timeout}
                onChange={(e) => {
                setTimeoutVal(parseInt(e.target.value));
                setHasUnsavedChanges(true);
              }}
                className="flex-1 accent-[#569ac4] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="w-24 text-center bg-slate-800 px-4 py-2 rounded-xl border border-white/5 font-mono text-[#569ac4] font-bold">
                {timeout} {i18n('settings_minutes')}
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Cog className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{i18n('settings_general_options')}</h2>
                <p className="text-sm text-slate-500">{i18n('settings_general_options_desc')}</p>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={allowFreezePinned}
                onChange={(e) => {
                  setAllowFreezePinned(e.target.checked);
                  setHasUnsavedChanges(true);
                }}
                className="w-5 h-5 rounded border-white/20 bg-slate-800 text-[#569ac4] focus:ring-[#569ac4] focus:ring-offset-0 cursor-pointer"
              />
              <div>
                <span className="text-slate-200 group-hover:text-white transition-colors">{i18n('settings_allow_freeze_pinned')}</span>
                <p className="text-xs text-slate-500">{i18n('settings_allow_freeze_pinned_desc')}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group mt-4">
              <input
                type="checkbox"
                checked={allowFreezeMediaPlaying}
                onChange={(e) => {
                  setAllowFreezeMediaPlaying(e.target.checked);
                  setHasUnsavedChanges(true);
                }}
                className="w-5 h-5 rounded border-white/20 bg-slate-800 text-[#569ac4] focus:ring-[#569ac4] focus:ring-offset-0 cursor-pointer"
              />
              <div>
                <span className="text-slate-200 group-hover:text-white transition-colors">{i18n('settings_allow_freeze_media')}</span>
                <p className="text-xs text-slate-500">{i18n('settings_allow_freeze_media_desc')}</p>
              </div>
            </label>
          </section>

          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#569ac4]/10 flex items-center justify-center text-[#569ac4]">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{i18n('settings_whitelist_title')}</h2>
                <p className="text-sm text-slate-500">{i18n('settings_whitelist_desc')}</p>
              </div>
            </div>
            <textarea
              value={whitelist}
              onChange={(e) => {
                setWhitelist(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder={i18n('settings_whitelist_placeholder')}
              className="w-full h-32 bg-slate-800 border border-white/5 rounded-xl p-4 text-slate-200 font-mono text-sm resize-none focus:outline-none focus:border-[#569ac4]/50"
            />
          </section>

          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{i18n('settings_privacy_title')}</h2>
                <p className="text-sm text-slate-500">{i18n('settings_privacy_desc')}</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <List className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{i18n('tab_states_title')}</h2>
                <p className="text-sm text-slate-500">{i18n('tab_states_description')}</p>
              </div>
            </div>

            {Object.keys(tabStates).length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <LayoutList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{i18n('tab_states_empty')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/5">
                      <th className="text-left py-3 px-4 font-medium">{i18n('tab_states_icon')}</th>
                      <th className="text-left py-3 px-4 font-medium">{i18n('tab_states_title_col')}</th>
                      <th className="text-left py-3 px-4 font-medium">{i18n('tab_states_last_active')}</th>
                      <th className="text-left py-3 px-4 font-medium">{i18n('tab_states_freeze_remaining')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tabStates).map(([tabId, state]) => (
                      <tr key={tabId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <img
                            src={state.favIconUrl || 'icon.png'}
                            alt=""
                            className="w-5 h-5 rounded"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'icon.png'; }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTabClick(parseInt(tabId))}
                            onMouseEnter={(e) => setHoveredTab({ tabId: parseInt(tabId), state, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoveredTab(null)}
                            className="text-slate-200 hover:text-[#569ac4] text-left truncate max-w-[200px] block cursor-pointer"
                          >
                            {state.title || i18n('tab_states_untitled')}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                          {formatLastActive(state.lastActive)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 font-mono text-xs ${state.isSuspended ? 'text-amber-400' : 'text-slate-400'}`}>
                            <Timer className="w-3 h-3" />
                            {getFreezeRemaining(parseInt(tabId))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="flex items-center justify-between pt-6">
            <p className="text-xs text-slate-600 italic">Version {version} • Powered by xwk<br/>Email: <a href="mailto:2380567@gmail.com?subject=About Tab Freeze Frame">2380567@gmail.com</a></p>
            <button
              ref={saveButtonRef}
              onClick={handleSave}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all duration-300
                ${saved ? 'bg-emerald-500 text-white' : 'bg-[#569ac4] text-white hover:bg-[#4a8ab4] hover:scale-105 active:scale-95'}
                shadow-xl shadow-[#569ac4]/20
              `}
            >
              {saved ? i18n('settings_saved') : <><Save className="w-5 h-5" /> {i18n('settings_save')}</>}
            </button>
          </div>
        </motion.div>
      </div>
      {hoveredTab && hoveredTab.state.screenshot && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ left: hoveredTab.x + 10, top: hoveredTab.y + 10 }}
        >
          <img
            src={hoveredTab.state.screenshot}
            alt=""
            className="w-64 rounded-lg border border-white/10 shadow-2xl"
          />
        </div>
      )}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed z-[100] flex flex-col items-center gap-1 cursor-pointer"
          style={{ left: tooltipPos.x, bottom: 80 }}
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
        >
          <span className="text-amber-400 text-sm font-medium whitespace-nowrap">{i18n('settings_click_to_save')}</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-amber-400" />
          </motion.div>
        </motion.div>
      )}
      {isIdle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-slate-950/50 to-slate-950/90" />
          <motion.button
            onClick={wakeUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative z-10 bg-white text-slate-950 px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-2xl shadow-blue-500/30 cursor-pointer"
          >
            <MousePointerClick className="w-6 h-6" />
            <span>{i18n('suspended_click_restore')}</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
