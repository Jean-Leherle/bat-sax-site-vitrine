import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import AddTrackModal from '../components/AddTrackModal';

type CommunityTrack = {
  id: number;
  user_id: string;
  title: string;
  game: string;
  status: string;
  youtube_link: string | null;
  musescore_link: string | null;
  spotify_link: string | null;
  accepted_track_id: number | null;
  profiles: { username: string; avatar_url: string }; // L'auteur
  votes: { user_id: string }[]; // La liste de tous les votes
  real_track?: { play_status: string }; // Si relié au catalogue batSax
  admin_comment?: string;
};

export default function Community() {
  // 1. DÉCLARATION DE TOUS LES ÉTATS (HOOKS)
  const [tracks, setTracks] = useState<CommunityTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myCount, setMyCount] = useState(0);

  // 2. EFFETS DE BORD (HOOKS)
  useEffect(() => {
    checkUser();
    fetchTracks();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('community_tracks')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .then(({ count }) => setMyCount(count || 0));
    }
  }, [user, tracks]);

  // 3. FONCTIONS UTILITAIRES
  const checkUser = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('community_tracks').select(`
        *,
        profiles:user_id (username, avatar_url),
        votes:community_votes (user_id),
        real_track:tracks!accepted_track_id (play_status)
      `);

    if (error) {
      console.error(error);
    } else if (data) {
      const sorted = (data as unknown as CommunityTrack[]).sort((a, b) => {
        const votesA = a.votes?.length || 0;
        const votesB = b.votes?.length || 0;
        if (votesB !== votesA) return votesB - votesA;
        return a.title.localeCompare(b.title);
      });
      setTracks(sorted);
    }
    setLoading(false);
  };

  const toggleVote = async (trackId: number, hasVoted: boolean) => {
    if (!user) {
      alert('Connecte-toi pour pouvoir voter !');
      return;
    }

    setTracks((current) =>
      current.map((t) => {
        if (t.id === trackId) {
          const newVotes = hasVoted
            ? t.votes.filter((v) => v.user_id !== user.id)
            : [...t.votes, { user_id: user.id }];
          return { ...t, votes: newVotes };
        }
        return t;
      })
    );

    if (hasVoted) {
      await supabase
        .from('community_votes')
        .delete()
        .match({ user_id: user.id, track_id: trackId });
    } else {
      await supabase
        .from('community_votes')
        .insert({ user_id: user.id, track_id: trackId });
    }
  };

  const deleteMyTrack = async (trackId: number, title: string) => {
    if (
      !window.confirm(
        `Es-tu sûr de vouloir retirer ta proposition "${title}" ?\nLes votes associés seront également perdus.`
      )
    ) {
      return;
    }

    if (!user) return;

    const { error } = await supabase
      .from('community_tracks')
      .delete()
      .match({ id: trackId, user_id: user.id });

    if (error) {
      alert('Erreur lors de la suppression.');
      console.error(error);
    } else {
      setTracks((current) => current.filter((t) => t.id !== trackId));
    }
  };

  // 4. CALCULS DÉRIVÉS
  const displayedTracks = tracks.filter((t) => {
    const matchesUser = showOnlyMine && user ? t.user_id === user.id : true;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.game.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesUser && matchesSearch;
  });

  // 5. RENDU CONDITIONNEL (Doit toujours être le dernier return avant le vrai contenu)
  if (loading) {
    return (
      <div className="text-center neon mt-12">Loading Community Server...</div>
    );
  }

  // 6. RENDU PRINCIPAL
  return (
    <div className="w-full flex flex-col items-center animate-fade-in px-4 mb-16">
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-6 gap-8 border-b border-gray-800 pb-8">
        <div className="text-center md:text-left">
          <h1 className="neon text-3xl mb-3">Liste de souhait</h1>
          <p className="opacity-70 text-sm">
            Vote pour les prochains morceaux que BatSax devra jouer !
          </p>
        </div>

        {user ? (
          <div className="flex flex-col items-center md:items-end gap-3">
            <button
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className={`text-[10px] font-['Press_Start_2P'] transition-all cursor-none px-3 py-1.5 rounded-lg border ${
                showOnlyMine
                  ? 'border-primary text-primary bg-primary/10 shadow-[0_0_10px_rgba(0,255,204,0.3)]'
                  : 'border-transparent opacity-50 hover:opacity-100 hover:border-gray-800'
              }`}
              title="Afficher uniquement mes propositions"
            >
              MES PROPOSITIONS: {myCount}/5
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={myCount >= 5}
              className="btn btn-primary cursor-none shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300 px-6"
            >
              ➕ PROPOSER UN MORCEAU
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="btn btn-outline border-primary text-primary hover:bg-primary hover:text-black cursor-none"
          >
            Se connecter pour participer
          </Link>
        )}
      </div>

      <div className="w-full max-w-4xl mb-8 flex justify-start">
        <div className="relative w-full md:w-1/2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 opacity-50 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Rechercher un morceau, un jeu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-12 bg-[#050505] border-gray-800 focus:border-primary focus:ring-1 focus:ring-primary cursor-none transition-all placeholder:text-sm placeholder:opacity-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-error cursor-none transition-colors"
              title="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6">
        {displayedTracks.length === 0 && (
          <div className="text-center opacity-50 py-16 italic bg-[#050505] rounded-2xl border border-gray-800">
            {searchQuery
              ? 'Aucun résultat pour cette recherche.'
              : showOnlyMine
                ? "Tu n'as encore proposé aucun morceau !"
                : 'La communauté est endormie. Sois le premier à proposer un morceau !'}
          </div>
        )}

        {displayedTracks.map((track) => {
          const votesCount = track.votes?.length || 0;
          const hasVoted = user
            ? track.votes?.some((v) => v.user_id === user.id)
            : false;

          let statusBadge = null;
          if (track.accepted_track_id && track.real_track) {
            statusBadge = (
              <span className="badge badge-success badge-sm font-bold shadow-sm shadow-green-500/20">
                DANS LE CATALOGUE : {track.real_track.play_status}
              </span>
            );
          } else if (track.status === 'retenu') {
            statusBadge = (
              <span className="badge badge-secondary badge-sm shadow-sm shadow-secondary/20">
                VALIDÉ PAR L'ÉQUIPE
              </span>
            );
          } else if (track.status === 'rejete') {
            statusBadge = (
              <span className="badge badge-error badge-sm opacity-50">
                REFUSÉ
              </span>
            );
          }

          return (
            <div
              key={track.id}
              className="relative bg-[#050505] border border-gray-800 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-primary/30 transition-colors shadow-xl shadow-black/50"
            >
              {user && track.user_id === user.id && (
                <button
                  onClick={() => deleteMyTrack(track.id, track.title)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 text-error/40 hover:text-error bg-error/5 hover:bg-error/20 p-2 rounded-lg cursor-none transition-all flex items-center justify-center border border-transparent hover:border-error/30"
                  title="Retirer ma proposition"
                >
                  🗑️
                </button>
              )}

              <div className="flex flex-col items-center justify-center shrink-0 w-20 bg-[#0a0a0a] py-4 rounded-xl border border-gray-800 shadow-inner">
                <button
                  onClick={() => toggleVote(track.id, hasVoted)}
                  className={`text-3xl cursor-none transition-transform hover:scale-110 ${hasVoted ? 'text-primary drop-shadow-[0_0_12px_rgba(0,255,204,0.4)]' : 'grayscale opacity-40 hover:opacity-80'}`}
                >
                  ▲
                </button>
                <span
                  className={`font-bold mt-2 text-lg ${hasVoted ? 'text-primary' : 'text-gray-500'}`}
                >
                  {votesCount}
                </span>
              </div>

              <div className="flex-1 flex flex-col pr-10">
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <h3 className="text-2xl font-bold text-white">
                    {track.title}
                  </h3>
                  {statusBadge}
                </div>
                <p className="text-sm uppercase tracking-widest opacity-80 font-['Press_Start_2P'] text-[10px] mt-1 text-primary/80">
                  {track.game}
                </p>
                {track.admin_comment && (
                  <div className="mt-4 p-3 bg-primary/10 border-l-2 border-primary rounded-lg text-xs animate-pulse-slow">
                    <span className="font-bold text-primary uppercase mr-2">
                      [Note BatSax] :
                    </span>
                    <span className="italic opacity-90">
                      {track.admin_comment}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-6 mt-6 text-sm border-t border-gray-800/50 pt-4">
                  <div className="flex items-center gap-3 opacity-60">
                    {track.profiles?.avatar_url ? (
                      <img
                        src={track.profiles.avatar_url}
                        alt="avatar"
                        className="w-6 h-6 rounded-full object-cover border border-gray-600"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">
                        👤
                      </div>
                    )}
                    <span>
                      Proposé par{' '}
                      <strong className="text-gray-300">
                        {track.profiles?.username || 'Anonyme'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 ml-auto items-center">
                    {track.youtube_link && (
                      <a
                        href={track.youtube_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400/80 hover:text-red-400 hover:underline cursor-none flex items-center gap-1"
                      >
                        ▶ YouTube
                      </a>
                    )}
                    {track.spotify_link && (
                      <a
                        href={track.spotify_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-400/80 hover:text-green-400 hover:underline cursor-none flex items-center gap-1"
                      >
                        🎧 Spotify
                      </a>
                    )}
                    {track.musescore_link && (
                      <a
                        href={track.musescore_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400/80 hover:text-blue-400 hover:underline cursor-none flex items-center gap-1"
                      >
                        🎼 MuseScore
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AddTrackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTracks();
        }}
        userId={user?.id || ''}
      />
    </div>
  );
}