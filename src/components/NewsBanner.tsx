import { useEffect, useState } from 'react';
import { useNews } from '../contexts/NewsContext';
import { useNavigate } from 'react-router-dom';

export default function NewsBanner() {
  const { active, unreadCount, markAllSeen, dismiss } = useNews();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (active.length === 0) return;
    // show if there is any unread OR any global (target_user IS NULL) active news
    const hasGlobal = active.some(n => !n.target_user);
    if (unreadCount > 0 || hasGlobal) setVisible(true);
  }, [active, unreadCount]);

  useEffect(() => { setIndex(0); setSkipped(new Set()); }, [active]);

  // auto-advance every 20s when visible
  useEffect(() => {
    const visibleCount = active.filter(n => !skipped.has(n.id)).length;
    if (!visible || visibleCount <= 1) return;
    const t = setInterval(() => {
      setIndex(i => (i + 1) % visibleCount);
    }, 20000);
    return () => clearInterval(t);
  }, [visible, active, skipped]);

  if (!visible) return null;
  const visibleNews = active.filter(n => !skipped.has(n.id));
  if (visibleNews.length === 0) return null;
  const n = visibleNews[index % visibleNews.length];

  return (
    <div className="fixed left-1/2 bottom-4 z-50 -translate-x-1/2 w-full max-w-4xl px-4">
      <div
        className="flex items-center justify-between gap-4 bg-black/80 text-white px-4 py-3 rounded-full border border-gray-800 shadow-lg"
        role="region"
        tabIndex={0}
        onClick={() => {
          // advance to next visible news
          const visibleNews = active.filter(item => !skipped.has(item.id));
          if (visibleNews.length <= 1) { setVisible(false); return; }
          setIndex(i => (i + 1) % visibleNews.length);
        }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const visibleNews = active.filter(item => !skipped.has(item.id)); if (visibleNews.length <= 1) { setVisible(false); return; } setIndex(i => (i + 1) % visibleNews.length); } }}
      >
        <div className="flex items-start gap-3">
          <div className="text-yellow-400 text-lg">⭐</div>
          <div>
            <div className="font-bold text-sm">
              <a
                href={n.link || '/'}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); markAllSeen(); setVisible(false); navigate(n.link || '/'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); markAllSeen(); setVisible(false); navigate(n.link || '/'); } }}
                className="underline-offset-2 hover:underline"
              >
                {n.title}
              </a>
            </div>
            <div className="text-xs opacity-70 max-w-xl truncate">
              <a
                href={n.link || '/'}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); markAllSeen(); setVisible(false); navigate(n.link || '/'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); markAllSeen(); setVisible(false); navigate(n.link || '/'); } }}
                className="underline-offset-2 hover:underline"
              >
                {n.content}
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* compteur seulement */}
          {visibleNews.length > 1 && (
            <div className="text-xs opacity-80 mr-2">{index + 1}/{visibleNews.length}</div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              // dismiss only current news locally and call dismiss handler
              setSkipped(prev => new Set(prev).add(n.id));
              try { dismiss(n.id); } catch (err) {}
              const remaining = visibleNews.length - 1;
              if (remaining <= 0) setVisible(false);
              else setIndex(i => i % Math.max(1, remaining));
            }}
            className="text-sm px-3 py-1 rounded bg-transparent border border-gray-700"
          >
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}
