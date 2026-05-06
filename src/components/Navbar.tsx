import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AudioPlayer from './AudioPlayer';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // 1. AJOUT DE : inline-flex items-center justify-center
  // Cela force le texte à rester parfaitement au milieu du bouton
  const linkClass = (path: string) =>
    `inline-flex items-center justify-center px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold cursor-none transition-all duration-300 border whitespace-nowrap flex-shrink-0 ${
      pathname === path
        ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_15px_rgba(0,255,204,0.4)]'
        : 'border-transparent text-gray-400 hover:text-[#00ffcc] hover:bg-[#00ffcc]/10 hover:border-[#00ffcc]/50 hover:shadow-[0_0_10px_rgba(0,255,204,0.2)]'
    }`;

  return (
    <div className="w-full bg-base-200 border-b border-base-300 px-3 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-y-3 gap-x-4 z-50">
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 flex-grow lg:flex-none">
        <Link
          to="/"
          className="flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-none"
        >
          <img
            src="/LogoBatsaxV1.webp"
            alt="Logo BatSax"
            className="h-8 w-auto object-contain drop-shadow-[0_0_5px_#00ffcc]"
          />
          <span className="hidden lg:inline-block text-xl neon hover:text-white hover:animate-pulse">
            BatSax
          </span>
        </Link>

        <div className="flex-none">
          <AudioPlayer />
        </div>
      </div>

      {/* 2. AJOUT DE : items-center ici pour que tout le groupe soit bien aligné avec le lecteur audio */}
      <div className="flex flex-grow items-center justify-center lg:justify-end gap-2 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
        <Link to="/community" className={linkClass('/community')}>
          <span className="lg:hidden">Jukebox</span>
          <span className="hidden lg:inline">Liste de souhait</span>
        </Link>
        <Link to="/next" className={linkClass('/next')}>
          <span className="lg:hidden">Prochain</span>
          <span className="hidden lg:inline">Prochain niveau</span>
        </Link>
        <Link to="/saves" className={linkClass('/saves')}>
          <span className="lg:hidden">Terminé</span>
          <span className="hidden lg:inline">Niveau terminé</span>
        </Link>

        {session && (
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center px-3 py-1.5 lg:py-2 rounded-lg 
            text-error  border-error/20 bg-transparent
            transition-all duration-300 ease-in-out cursor-none
            hover:bg-error hover:text-white hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] 
            ml-1 lg:ml-2 flex-shrink-0"
            title="Se déconnecter"
          >
            <span className="text-xl leading-none">⏻</span>
          </button>
        )}
      </div>
    </div>
  );
}
