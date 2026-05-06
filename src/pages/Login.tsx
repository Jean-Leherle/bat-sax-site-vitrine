import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Petit état pour cacher/afficher le login admin
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const navigate = useNavigate();

  // --- LOGIN COMMUNAUTÉ (OAUTH) ---
  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/community` // Redirigera vers la future page communauté
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

        <button
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
          className="btn cursor-none bg-white hover:bg-gray-200 text-black border-none"
        >
          <span className="text-xl">G</span> Se connecter avec Google
        </button>

        {/* MENTION LÉGALE (Consentement fluide) */}
        <p className="text-[9px] opacity-50 mt-4 text-center leading-relaxed italic">
          En te connectant, tu acceptes l'utilisation de cookies strictement
          nécessaires à la gestion de ta session et de tes votes. Aucune donnée
          personnelle n'est revendue ou utilisée à des fins publicitaires.
        </p>
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
                className="input input-bordered input-sm w-full bg-base-100"
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
                className="input input-bordered input-sm w-full bg-base-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm btn-outline mt-2 font-['Press_Start_2P'] text-[8px]"
            >
              {loading ? 'VERIFICATION...' : 'INITIATE UPLINK'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
