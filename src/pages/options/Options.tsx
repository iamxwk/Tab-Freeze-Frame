import React, { useEffect, useState } from 'react';
import { Save, Clock, ShieldCheck, Info, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { i18n } from '../../utils/i18n';

export default function OptionsPage() {
  const [timeout, setTimeoutVal] = useState(1);
  const [whitelist, setWhitelist] = useState('');
  const [saved, setSaved] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    if (chrome.storage) {
      chrome.storage.local.get('extension_settings', (data) => {
        if (data.extension_settings) {
          setTimeoutVal(data.extension_settings.timeoutMinutes || 1);
          setWhitelist(data.extension_settings.whitelist || '');
        }
      });
    }
    if (chrome.runtime?.getManifest()) {
      setVersion(chrome.runtime.getManifest().version || '');
    }
  }, []);

  const handleSave = () => {
    if (chrome.storage) {
      chrome.storage.local.set({
        extension_settings: {
          timeoutMinutes: timeout,
          whitelist: whitelist
        }
      }, () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
                onChange={(e) => setTimeoutVal(parseInt(e.target.value))}
                className="flex-1 accent-[#569ac4] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="w-24 text-center bg-slate-800 px-4 py-2 rounded-xl border border-white/5 font-mono text-[#569ac4] font-bold">
                {timeout} {i18n('settings_minutes')}
              </div>
            </div>
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
              onChange={(e) => setWhitelist(e.target.value)}
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

          <div className="flex items-center justify-between pt-6">
            <p className="text-xs text-slate-600 italic">Version {version} • Powered by xwk<br/>Email: <a href="mailto:2380567@gmail.com?subject=About Tab Freeze Frame">2380567@gmail.com</a></p>
            <button
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
    </div>
  );
}
