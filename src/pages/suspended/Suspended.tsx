import React, {useEffect, useState} from 'react';
import {MousePointerClick, RefreshCw} from 'lucide-react';
import {motion} from 'motion/react';
import {i18n} from '../../utils/i18n';

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
          document.title = '* ' + tabStates[tabId].title;

          let link = document.querySelector("link[rel*='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = tabStates[tabId].favIconUrl || 'icon.png';
        } else {
          setState({
            url: originalUrl || '',
            title: i18n('suspended_untitled'),
          });
          document.title = i18n('suspended_untitled');
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
      setState({
        url: 'https://github.com/trending',
        title: i18n('suspended_demo_title'),
        screenshot: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=2000',
        favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg'
      });
      document.title = i18n('suspended_demo_title');
    }
  }, []);

  const handleRestore = () => {
    if (state?.url) {
      window.location.href = state.url;
    }
  };

  if (loading) return null;

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"/>

      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="w-[80vw] h-[calc(100vh-140px)] z-10 flex flex-col items-stretch"
      >
<div
          onClick={handleRestore}
          className="group relative w-full h-full mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl cursor-pointer hover:border-blue-500/50 transition-all duration-500"
        >
          {state?.screenshot ? (
            <div className="relative w-full h-full">
              <img
                src={state.screenshot}
                alt="Page Snapshot"
                className="w-full h-full object-cover object-top opacity-70 group-hover:opacity-90 transition-opacity duration-700"
                referrerPolicy="no-referrer"
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                <motion.div
                  whileHover={{scale: 1.05}}
                  whileTap={{scale: 0.95}}
                  className="bg-white text-slate-950 px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl"
                >
                  <MousePointerClick className="w-5 h-5"/>
                  {i18n('suspended_click_restore')}
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
              <RefreshCw className="w-12 h-12 text-slate-700 mt-8 mb-4 animate-spin-slow"/>
              <p className="text-slate-500">{i18n('suspended_snapshot_unavailable')}</p>
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent p-8 pt-20">
            <div className="flex items-center gap-4">
              {state?.favIconUrl && (
                <img src={state.favIconUrl} alt="" className="w-6 h-6 rounded"/>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate text-white">{state?.title}</h2>
                <p className="text-sm text-slate-400 truncate opacity-60 font-mono mt-1 italic">{state?.url}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-700 font-mono tracking-widest uppercase">
Tab Freeze Frame
      </div>
    </div>
  );
}
