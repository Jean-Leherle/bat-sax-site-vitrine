import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour l'UI
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showGoogleInfo, setShowGoogleInfo] = useState(false); // NOUVEAU : Gère l'affichage de l'explication

  const navigate = useNavigate();

  // --- LOGIN COMMUNAUTÉ (OAUTH) ---
  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/community` 
      }
    });
    if (error) {
      setError(`Erreur de connexion avec ${provider}`);
      setLoading(false);
    }
  };

  // --- LOGIN ADMIN (EMAIL/MDP) ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setError('Identifiants incorrects.');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 mt-12 w-full max-w-md mx-auto animate-fade-in">
      <h1 className="neon text-3xl mb-2">Rejoindre BatSax</h1>
      <p className="text-sm opacity-70 mb-8 text-center">
        Connecte-toi pour proposer tes morceaux et voter pour les prochaines
        setlists !
      </p>

      {error && (
        <p className="text-red-500 mb-4 text-sm bg-red-900/20 p-3 rounded border border-red-500">
          {error}
        </p>
      )}

      {/* --- BLOC COMMUNAUTÉ --- */}
      <div className="flex flex-col gap-4 w-full bg-[#0a0a0a] p-6 border border-primary/50 rounded-xl shadow-[0_0_15px_rgba(0,255,204,0.1)]">
        
        <button
          onClick={() => handleOAuthLogin('discord')}
          disabled={loading}
          className="btn cursor-none bg-[#5865F2] hover:bg-[#4752C4] text-white border-none shadow-[0_0_10px_rgba(88,101,242,0.5)]"
        >
          <span className="text-xl">🎮</span> Se connecter avec Discord
        </button>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="btn cursor-none bg-white hover:bg-gray-200 text-black border-none"
          >
            <span className="text-xl">G</span> Se connecter avec Google
          </button>
          
          {/* NOUVEAU : Avertissement Google discret */}
          <div className="flex flex-col items-center mt-1">
            <button 
              onClick={() => setShowGoogleInfo(!showGoogleInfo)}
              className="text-[9px] opacity-40 hover:opacity-100 transition-opacity cursor-none underline decoration-dashed underline-offset-2"
            >
              Note de sécurité Google ⓘ
            </button>
            
            {showGoogleInfo && (
              <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg text-xs md:text-sm text-gray-300 leading-relaxed animate-pop-in text-center shadow-inner">
                La page Google affichera un{' '}
                <span className="text-primary font-bold tracking-wider mx-1">
                  {"étrange lien".split('').map((char, index) => (
                    <span 
                      key={index} 
                      className="animate-letter-wave"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Si c'est un espace, on force un espace insécable pour ne pas casser le mot */}
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </span>{' '}
                finissant par <strong className="text-white">supabase.co</strong> au lieu de BatSax.fr. C'est tout à fait normal, il s'agit de notre <strong>cartouche</strong> ultra-sécurisée qui héberge nos <strong>sauvegardes</strong> !
              </div>
            )}
            </div>
          </div>

        {/* NOUVEAU : MENTION LÉGALE ALLÉGÉE AVEC LIEN */}
        <div className="border-t border-gray-800 mt-2 pt-4">
          <p className="text-[10px] opacity-60 text-center leading-relaxed">
            En te connectant, tu acceptes nos {' '}
            <Link to="/privacy" className="text-primary hover:text-white underline transition-colors cursor-none font-bold">
              Règles de confidentialité
            </Link>.
            <br />
            Aucune donnée n'est revendue.
          </p>
        </div>
      </div>

      {/* --- BLOC ACCÈS ADMIN (DISCRET) --- */}
      <div className="mt-8 w-full flex flex-col items-center">
        <button
          onClick={() => setShowAdminLogin(!showAdminLogin)}
          className="text-[10px] opacity-30 hover:opacity-100 font-['Press_Start_2P'] tracking-widest transition-opacity cursor-none"
        >
          {showAdminLogin ? "Fermer l'accès Admin" : 'Accès Admin'}
        </button>

        {showAdminLogin && (
          <form
            onSubmit={handleAdminLogin}
            className="flex flex-col gap-4 w-full bg-[#050505] p-6 border border-gray-800 rounded-xl mt-4 animate-pop-in"
          >
            <div className="form-control">
              <label className="label">
                <span className="label-text opacity-70 text-xs">
                  Email Admin
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100 cursor-none"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text opacity-70 text-xs">
                  Mot de passe
                </span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100 cursor-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm btn-outline mt-2 font-['Press_Start_2P'] text-[8px] cursor-none"
            >
              {loading ? 'VERIFICATION...' : 'INITIATE UPLINK'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}