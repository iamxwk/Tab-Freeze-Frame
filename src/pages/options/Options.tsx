import React, { useEffect, useState } from 'react';
import { Save, Clock, ShieldCheck, Zap, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function OptionsPage() {
  const [timeout, setTimeoutVal] = useState(1);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (chrome.storage) {
      chrome.storage.local.get('extension_settings', (data) => {
        if (data.extension_settings) {
          setTimeoutVal(data.extension_settings.timeoutMinutes);
        }
      });
    }
  }, []);

  const handleSave = () => {
    if (chrome.storage) {
      chrome.storage.local.set({
        extension_settings: { timeoutMinutes: timeout }
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
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white w-7 h-7 fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">设置</h1>
            <p className="text-slate-500 mt-1">管理您的 Tab Freeze Frame 配置</p>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Timeout Card */}
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">挂起超时</h2>
                <p className="text-sm text-slate-500">标签页闲置多长时间后自动挂起</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <input 
                type="range" 
                min="1" 
                max="120" 
                value={timeout}
                onChange={(e) => setTimeoutVal(parseInt(e.target.value))}
                className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="w-24 text-center bg-slate-800 px-4 py-2 rounded-xl border border-white/5 font-mono text-blue-400 font-bold">
                {timeout} 分钟
              </div>
            </div>
          </section>

          {/* Info Card */}
          <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">隐私与安全</h2>
                <p className="text-sm text-slate-500">所有截图和数据均存储在本地，不会上传到任何服务器。</p>
              </div>
            </div>
          </section>

          {/* Help Card */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4 text-sm text-blue-300">
            <Info className="w-5 h-5 shrink-0" />
            <p>提示：你可以点击快照左下角的链接直接复制原始 URL。</p>
          </div>

          <div className="flex items-center justify-between pt-6">
            <p className="text-xs text-slate-600 italic">版本 1.0.0 • 由 Tab Freeze Frame 强力驱动</p>
            <button 
              onClick={handleSave}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all duration-300
                ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95'}
                shadow-xl shadow-blue-600/20
              `}
            >
              {saved ? '已保存！' : <><Save className="w-5 h-5" /> 保存更改</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
