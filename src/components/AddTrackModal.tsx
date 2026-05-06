import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { searchGames, type RawgGame } from '../services/rawg';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
};

// Types pour les morceaux existants
type ExistingTrack = {
  title: string;
  youtube_link: string | null;
  musescore_link: string | null;
  spotify_link: string | null;
};

export default function AddTrackModal({
  isOpen,
  onClose,
  onSuccess,
  userId
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RawgGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<RawgGame | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [, setHasSearched] = useState(false);

  // Données étendues pour les doublons
  const [existingTracks, setExistingTracks] = useState<ExistingTrack[]>([]);

  const [trackTitle, setTrackTitle] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [musescoreLink, setMusescoreLink] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');

  // --- LOGIQUE DE NORMALISATION ---
  const normalizeTitle = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizeUrl = (url: string | null) => {
    if (!url) return null;
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/youtube\.com\/watch\?v=/, 'youtu.be/') // Unifie les formats Youtube
      .replace(/\/$/, ''); // Retire le slash final
  };

  // Récupérer et trier les morceaux existants
  useEffect(() => {
    if (selectedGame) {
      supabase
        .from('community_tracks')
        .select('title, youtube_link, musescore_link, spotify_link')
        .eq('game', selectedGame.name)
        .order('title', { ascending: true }) // Tri alphabétique
        .then(({ data }) => setExistingTracks(data || []));
    }
  }, [selectedGame]);

  // --- DÉTECTION DE DOUBLON EN TEMPS RÉEL ---
  const duplicateConflict = useMemo(() => {
    if (!trackTitle.trim() && !youtubeLink && !spotifyLink && !musescoreLink)
      return null;

    const normTitle = normalizeTitle(trackTitle);
    const normYT = normalizeUrl(youtubeLink);
    const normSpotify = normalizeUrl(spotifyLink);
    const normMuse = normalizeUrl(musescoreLink);

    return existingTracks.find((t) => {
      if (normTitle && normalizeTitle(t.title) === normTitle) return true;
      if (normYT && normalizeUrl(t.youtube_link) === normYT) return true;
      if (normSpotify && normalizeUrl(t.spotify_link) === normSpotify)
        return true;
      if (normMuse && normalizeUrl(t.musescore_link) === normMuse) return true;
      return false;
    });
  }, [trackTitle, youtubeLink, spotifyLink, musescoreLink, existingTracks]);

  // (Le reste des useEffect de recherche RAWG et Reset reste identique...)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await searchGames(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setHasSearched(true);
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setSelectedGame(null);
      setTrackTitle('');
      setYoutubeLink('');
      setMusescoreLink('');
      setSpotifyLink('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateConflict) {
      setError(`Doublon détecté : "${duplicateConflict.title}" existe déjà.`);
      return;
    }

    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('community_tracks')
        .insert({
          user_id: userId,
          game: selectedGame?.name,
          title: trackTitle.trim(),
          youtube_link: youtubeLink.trim() || null,
          musescore_link: musescoreLink.trim() || null,
          spotify_link: spotifyLink.trim() || null,
          status: 'en_vote'
        });
      if (dbError) throw dbError;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0a0a0a] border border-primary/30 shadow-2xl shadow-primary/10 rounded-2xl p-8 w-full max-w-lg relative animate-pop-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-white cursor-none"
        >
          ✕
        </button>
        <h2 className="neon text-2xl mb-2">Proposer un morceau</h2>

        {error && (
          <p className="text-red-400 mb-4 text-xs bg-red-950/30 border border-red-500/50 p-3 rounded-lg mt-4">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6 mt-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-primary font-bold">
                  Jeu vidéo
                </span>
              </label>
              <input
                type="text"
                placeholder="Rechercher un jeu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-primary bg-base-100 cursor-none px-2 mx-2"
              />
            </div>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
              {isSearching && (
                <div className="loading loading-spinner text-primary mx-auto my-4"></div>
              )}
              {searchResults.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`flex items-center gap-4 p-2 rounded-lg border transition-all ${selectedGame?.id === game.id ? 'border-primary bg-primary/10' : 'border-gray-800 bg-[#0f0f0f]'}`}
                >
                  <img
                    src={game.background_image || ''}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <span className="text-sm font-bold">{game.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedGame}
              className="btn btn-primary cursor-none"
            >
              SUIVANT
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
            <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] opacity-40 uppercase font-bold">
                Déjà proposés (Trié A-Z) :
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {existingTracks.map((t, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                      duplicateConflict?.title === t.title
                        ? 'bg-red-500/20 border-red-500 text-red-200 animate-pulse' // MISE EN ÉVIDENCE
                        : 'bg-gray-900 border-gray-800 opacity-60'
                    }`}
                  >
                    {t.title}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom du morceau *</span>
              </label>
              <input
                type="text"
                required
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                className={`input input-bordered bg-base-100 ${duplicateConflict ? 'input-error' : 'input-primary'}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input
                type="url"
                placeholder="Lien YouTube"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                className={`input input-sm input-bordered ${duplicateConflict && normalizeUrl(youtubeLink) === normalizeUrl(duplicateConflict.youtube_link) ? 'input-error' : ''}`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="url"
                  placeholder="MuseScore"
                  value={musescoreLink}
                  onChange={(e) => setMusescoreLink(e.target.value)}
                  className="input input-sm input-bordered"
                />
                <input
                  type="url"
                  placeholder="Spotify"
                  value={spotifyLink}
                  onChange={(e) => setSpotifyLink(e.target.value)}
                  className="input input-sm input-bordered"
                />
              </div>
            </div>

            {duplicateConflict && (
              <p className="text-[10px] text-red-400 font-bold italic text-center">
                ⚠️ Ce contenu (titre ou lien) est identique à "
                {duplicateConflict.title}"
                Si il y a erreur sur ces morceaux, contactez les admins !
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !!duplicateConflict}
              className="btn btn-primary mt-4"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'VALIDER LA PROPOSITION'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
