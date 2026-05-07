import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AudioPlayer from './AudioPlayer';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // États pour l'édition du pseudo
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    // 1. Initialisation de la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    // 2. Écoute des changements de connexion
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Récupération du profil (Pseudo + Rôle)
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (data && !error) {
      setProfile(data);
      setEditName(data.username);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Afficher une notification temporaire
  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 4. Fonction de sauvegarde du pseudo
  const handleSaveName = async () => {
    const newName = editName.trim();

    // Si inchangé, on ferme juste l'édition
    if (!newName || newName === profile?.username) {
      setIsEditing(false);
      setEditName(profile?.username || ''); 
      return;
    }

    // On tente la mise à jour
    const { error } = await supabase
      .from('profiles')
      .update({ username: newName })
      .eq('id', session.user.id);

    if (error) {
      // Analyse de l'erreur renvoyée par les contraintes SQL
      if (error.message.includes('username_length_check')) {
        showNotification("⚠️ Le pseudo doit contenir entre 3 et 15 caractères.");
      } else if (error.message.includes('username_banned_content_check')) {
        showNotification("🛑 Ce pseudo contient un terme non autorisé.");
      } else {
        showNotification("Erreur lors de la modification du pseudo.");
        console.error(error);
      }
      // On remet l'ancien nom en cas d'échec
      setEditName(profile?.username);
    } else {
      // Succès
      setProfile({ ...profile, username: newName });
      showNotification("✅ Pseudo modifié avec succès.", 'success');
    }
    
    setIsEditing(false);
  };

  const linkClass = (path: string) =>
    `inline-flex items-center justify-center px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold cursor-none transition-all duration-300 border whitespace-nowrap flex-shrink-0 ${
      pathname === path
        ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_15px_rgba(0,255,204,0.4)]'
        : 'border-transparent text-gray-400 hover:text-[#00ffcc] hover:bg-[#00ffcc]/10 hover:border-[#00ffcc]/50 hover:shadow-[0_0_10px_rgba(0,255,204,0.2)]'
    }`;

  return (
    <div className="w-full bg-base-200 border-b border-base-300 px-3 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-y-3 gap-x-4 z-50">
      
      {/* NOTIFICATION */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 z-50 ${
          notification.type === 'error' 
            ? 'bg-red-900/80 text-red-100 border border-red-700' 
            : 'bg-green-900/80 text-green-100 border border-green-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* GROUPE 1 : LOGO + LECTEUR */}
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

      {/* GROUPE 2 : NAVIGATION + PROFIL + DÉCONNEXION */}
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

        {/* AFFICHAGE DU PROFIL ET BOUTONS UTILISATEUR */}
        {session && profile && (
          <div className="flex items-center gap-3 ml-2 border-l border-gray-800 pl-3">
            
            {/* BOUTON ADMIN (Visible uniquement si admin) */}
            {profile.role === 'admin' && (
              <Link 
                to="/admin" 
                className="text-xl hover:scale-110 transition-transform cursor-none drop-shadow-[0_0_5px_#00ffcc]" 
                title="Dashboard Admin"
              >
                ⚙️
              </Link>
            )}

            {/* PSEUDO ÉDITABLE */}
            {isEditing ? (
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, 15))}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                minLength={3}
                maxLength={15}
                className="input input-xs input-bordered w-24 bg-[#050505] text-primary border-primary cursor-none focus:outline-none"
              />
            ) : (
              <span 
                onClick={() => setIsEditing(true)} 
                className="text-xs lg:text-sm font-bold text-gray-300 cursor-none hover:text-primary transition-colors border-b border-transparent hover:border-primary border-dashed"
                title="Modifier mon pseudo"
              >
                {profile.username}
              </span>
            )}

            {/* BOUTON DÉCONNEXION */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-3 py-1.5 lg:py-2 rounded-lg text-error border-error/20 bg-transparent transition-all duration-300 ease-in-out cursor-none hover:bg-error hover:text-white hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] flex-shrink-0"
              title="Se déconnecter"
            >
              <span className="text-xl leading-none">⏻</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}