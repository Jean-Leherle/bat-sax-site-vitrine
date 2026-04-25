import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

import AdminConcerts from '../components/admin/AdminConcerts';
import AdminTracks from '../components/admin/AdminTracks';
import AdminSetlists from '../components/admin/AdminSetlists';

export default function Admin() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'concerts' | 'tracks' | 'setlists'>('concerts');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkUser();
  }, [navigate]);

  if (isCheckingAuth) {
    return <div className="p-6 text-center neon mt-12">Vérification des habilitations...</div>;
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-6xl mx-auto">
      <h1 className="neon mb-8 text-3xl text-center">Dashboard Administrateur</h1>

      {/* MENUS D'ONGLETS */}
      <div className="flex flex-wrap justify-center gap-4 mb-10 border-b border-gray-800 pb-6">
        <button
          className={`btn cursor-none transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_#00ffcc] ${activeTab === 'concerts' ? 'btn-primary shadow-[0_0_10px_#00ffcc]' : 'btn-outline'}`}
          onClick={() => setActiveTab('concerts')}
        >
          📅 Concerts
        </button>
        <button
          className={`btn cursor-none transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_#00ffcc] ${activeTab === 'tracks' ? 'btn-primary shadow-[0_0_10px_#00ffcc]' : 'btn-outline'}`}
          onClick={() => setActiveTab('tracks')}
        >
          🎵 Catalogue Morceaux
        </button>
        <button
          className={`btn cursor-none transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_#00ffcc] ${activeTab === 'setlists' ? 'btn-primary shadow-[0_0_10px_#00ffcc]' : 'btn-outline'}`}
          onClick={() => setActiveTab('setlists')}
        >
          📋 Éditer Setlists
        </button>
      </div>

      {/* AFFICHAGE DU COMPOSANT SÉLECTIONNÉ */}
      <div className="transition-opacity duration-300 animate-fade-in">
        {activeTab === 'concerts' && <AdminConcerts />}
        {activeTab === 'tracks' && <AdminTracks />}
        {activeTab === 'setlists' && <AdminSetlists />}
      </div>
    </div>
  );
}