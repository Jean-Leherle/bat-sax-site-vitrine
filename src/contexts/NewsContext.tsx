import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

export type NewsItem = {
  id: string;
  title: string;
  content?: string;
  target_user?: string | null;
  link?: string | null;
  start_at: string; // ISO
  end_at?: string | null; // ISO
  created_at?: string;
};

type NewsContextValue = {
  news: NewsItem[];
  active: NewsItem[];
  unreadCount: number;
  markAllSeen: () => void;
  dismiss: (id: string) => void;
};

const NewsContext = createContext<NewsContextValue | undefined>(undefined);

const LOCAL_LAST_SEEN = 'batsax:lastNewsSeenAt';
const LOCAL_DISMISSED_PREFIX = 'batsax:newsDismissed:';

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string>(() => {
    return localStorage.getItem(LOCAL_LAST_SEEN) || new Date(0).toISOString();
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current session and profile last seen
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user?.id) {
        setUserId(session.user.id);
        // get profile last_news_seen_at
        const { data, error } = await supabase
          .from('profiles')
          .select('last_news_seen_at')
          .eq('id', session.user.id)
          .single();
        if (!error && data?.last_news_seen_at) {
          setLastSeenAt(new Date(data.last_news_seen_at).toISOString());
        }
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) setUserId(session.user.id);
      else setUserId(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Persist local lastSeenAt when it changes
  useEffect(() => {
    try { localStorage.setItem(LOCAL_LAST_SEEN, lastSeenAt); } catch (e) {}
  }, [lastSeenAt]);

  // Fetch active news from Supabase
  const fetchNews = async () => {
    try {
      if (userId) {
        // fetch news where target_user is null (global) OR equals current user
        const filter = `target_user.is.null,target_user.eq.${userId}`;
        const { data, error } = await supabase.from('news').select('*').or(filter).order('created_at', { ascending: false });
        if (!error && data) setNews(data as NewsItem[]);
      } else {
        // only global news (target_user IS NULL)
        const { data, error } = await supabase.from('news').select('*').is('target_user', null).order('created_at', { ascending: false });
        if (!error && data) setNews(data as NewsItem[]);
      }
    } catch (e) {
      console.error('fetchNews error', e);
    }
  };

  useEffect(() => {
    fetchNews();
    // subscribe realtime to news table inserts/updates
    const channel = supabase.channel('public:news').on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, payload => {
      fetchNews();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const active = useMemo(() => {
    const now = new Date();
    return news.filter(n => {
      const start = new Date(n.start_at);
      const end = n.end_at ? new Date(n.end_at) : null;
      if (start > now) return false;
      if (end && end < now) return false;
      return true;
    });
  }, [news]);

  const unreadCount = useMemo(() => {
    const last = new Date(lastSeenAt);
    // Only count unread for targeted (per-user) news. Global news rely on end_at.
    return active.filter(n => n.target_user && new Date(n.created_at || n.start_at) > last).length;
  }, [active, lastSeenAt]);

  const markAllSeen = async () => {
    const now = new Date().toISOString();
    setLastSeenAt(now);
    if (userId) {
      try {
        await supabase.from('profiles').update({ last_news_seen_at: now }).eq('id', userId);
      } catch (e) {
        // ignore
      }
    }
  };

  const dismiss = (id: string) => {
    try { localStorage.setItem(LOCAL_DISMISSED_PREFIX + id, '1'); } catch (e) {}
    markAllSeen();
  };

  return (
    <NewsContext.Provider value={{ news, active, unreadCount, markAllSeen, dismiss }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error('useNews must be used within NewsProvider');
  return ctx;
}

export default NewsProvider;
