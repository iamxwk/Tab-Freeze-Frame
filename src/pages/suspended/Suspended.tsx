import React, { useEffect, useState } from 'react';
import { MousePointerClick, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TabState {
  url: string;
  title: string;
  screenshot?: string;
  favIconUrl?: string;
}

export default function SuspendedPage() {
  const [state, setState] = useState<TabState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabId = params.get('tabId');
    const originalUrl = params.get('url');

    if (chrome.storage && tabId !== 'demo') {
      chrome.storage.local.get('tab_states', (data) => {
        const tabStates = data.tab_states || {};
        if (tabId && tabStates[tabId]) {
          setState(tabStates[tabId]);
          document.title = tabStates[tabId].title;
        } else {
          setState({
            url: originalUrl || '',
            title: '未命名的标签页',
          });
          document.title = '未命名的标签页';
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
      setState({
        url: 'https://github.com/trending',
        title: 'GitHub Trending - 示例页面',
        screenshot: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=2000',
        favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg'
      });
      document.title = 'GitHub Trending - 示例页面';
    }
  }, []);

  const handleRestore = () => {
    if (state?.url) {
      window.location.href = state.url;
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full z-10 flex flex-col items-center"
      >
        <div className="flex items-center gap-3 mb-8">
          {state?.favIconUrl ? (
            <img src={state.favIconUrl} alt="" className="w-10 h-10 rounded-xl" />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {state?.title || '未命名的标签页'}
          </h1>
        </div>

        <div 
          onClick={handleRestore}
          className="group relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl cursor-pointer hover:border-blue-500/50 transition-all duration-500"
        >
          {state?.screenshot ? (
            <img 
              src={state.screenshot} 
              alt="Page Snapshot" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
               <RefreshCw className="w-12 h-12 text-slate-700 mb-4 animate-spin-slow" />
               <p className="text-slate-500">快照不可用</p>
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-slate-950 px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl"
            >
              <MousePointerClick className="w-5 h-5" />
              点击恢复页面
            </motion.div>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent p-8 pt-20">
            <div className="flex items-center gap-4">
              {state?.favIconUrl && (
                <img src={state.favIconUrl} alt="" className="w-6 h-6 rounded" />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate text-white">{state?.title}</h2>
                <p className="text-sm text-slate-400 truncate opacity-60 font-mono mt-1 italic">{state?.url}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>内存已释放</span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <span>点击任意位置恢复</span>
        </div>
      </motion.div>

      {/* Subtle bottom text */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-700 font-mono tracking-widest uppercase">
        Suspended to optimize performance
      </div>
    </div>
  );
}
