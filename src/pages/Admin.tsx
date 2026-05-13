import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

import AdminConcerts from '../components/admin/AdminConcerts';
import AdminTracks from '../components/admin/AdminTracks';
import AdminSetlists from '../components/admin/AdminSetlists';
import AdminMembers from '../components/admin/AdminMembers';
import AdminCommunity from "../components/admin/AdminCommunity";
import AdminMedia from "../components/admin/AdminMedia";

export default function Admin() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"concerts" | "members" | "tracks" | "setlists" | "community" | "media">("concerts");

  useEffect(() => {
    const checkUserAndRole = async () => {
      // 1. On vérifie la session globale
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // 2. On vérifie le RÔLE dans la table profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        alert("🔒 Accès refusé : Vous n'êtes pas administrateur.");
        // Si c'est un fan qui a fouillé, on le renvoie à l'accueil
        navigate('/');
      } else {
        setIsCheckingAuth(false);
      }
    };
    
    checkUserAndRole();
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="p-6 text-center neon mt-12">
        Vérification des habilitations de sécurité...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-6xl mx-auto">
      <h1 className="neon mb-8 text-3xl text-center">
        Dashboard Administrateur
      </h1>

      {/* MENUS D'ONGLETS */}
      <div className="flex flex-wrap justify-center gap-4 mb-10 border-b border-gray-800 pb-6">
        <button
          className={`btn cursor-none transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_#00ffcc] ${activeTab === 'concerts' ? 'btn-primary shadow-[0_0_10px_#00ffcc]' : 'btn-outline'}`}
          onClick={() => setActiveTab('concerts')}
        >
          📅 Concerts
        </button>
        <button
          className={`btn cursor-none transition-all duration-300 ${activeTab === 'media' ? 'btn-primary shadow-[0_0_15px_#00ffcc]' : 'btn-outline'}`}
          onClick={() => setActiveTab('media')}
        >
          🖼️ Médiathèque
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
        <button 
          onClick={() => setActiveTab("community")} 
          className={`tab tab-bordered cursor-none ${activeTab === "community" ? "tab-active text-primary border-primary" : ""}`}
        >
          💬 Suggestions
        </button>
        <button
          className={`btn cursor-none transition-all duration-300 hover:scale-105 ${activeTab === 'members' ? 'btn-primary shadow-[0_0_15px_#00ffcc]' : 'btn-outline'}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Équipe
        </button>
      </div>

      {/* AFFICHAGE DU COMPOSANT SÉLECTIONNÉ */}
      <div className="transition-opacity duration-300 animate-fade-in">
        {activeTab === 'concerts' && <AdminConcerts />}
        {activeTab === 'tracks' && <AdminTracks />}
        {activeTab === 'setlists' && <AdminSetlists />}
        {activeTab === 'media' && <AdminMedia />}
        {activeTab === 'members' && <AdminMembers />}
        {activeTab === "community" && <AdminCommunity />}
      </div>
    </div>
  );
}
