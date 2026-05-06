import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

type Track = {
  id: number;
  title: string;
  game: string;
  status: string;
  admin_comment: string | null;
  youtube_link: string | null;
  musescore_link: string | null;
  spotify_link: string | null;
  profiles: { username: string };
  votes: { user_id: string }[];
};

type SortOption = 'votes' | 'newest' | 'oldest';

export default function AdminCommunity() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('votes');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Track>>({});

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('community_tracks').select(`
        *,
        profiles:user_id (username),
        votes:community_votes (user_id)
      `);

    if (error) console.error(error);
    else if (data) sortAndSetTracks(data as any, sortBy);
    setLoading(false);
  };

  const sortAndSetTracks = (data: Track[], method: SortOption) => {
    const sorted = [...data].sort((a, b) => {
      if (method === 'votes')
        return (b.votes?.length || 0) - (a.votes?.length || 0);
      if (method === 'newest') return b.id - a.id; // Utilise l'ID ou created_at
      return a.id - b.id;
    });
    setTracks(sorted);
  };

  const handleSortChange = (method: SortOption) => {
    setSortBy(method);
    sortAndSetTracks(tracks, method);
  };

  const startEdit = (track: Track) => {
    setEditingId(track.id);
    setEditForm(track);
  };

  const deleteTrack = async (id: number, title: string) => {
    // Toujours demander confirmation pour une suppression
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer définitivement "${title}" ?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from('community_tracks')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erreur lors de la suppression');
      console.error(error);
    } else {
      // Rafraîchir la liste localement
      setTracks(tracks.filter((t) => t.id !== id));
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('community_tracks')
      .update({
        title: editForm.title,
        game: editForm.game,
        youtube_link: editForm.youtube_link,
        musescore_link: editForm.musescore_link,
        spotify_link: editForm.spotify_link,
        admin_comment: editForm.admin_comment,
        status: editForm.status
      })
      .eq('id', editingId);

    if (error) alert('Erreur lors de la sauvegarde');
    else {
      setEditingId(null);
      fetchTracks();
    }
  };

  if (loading)
    return <div className="p-8 text-center neon">SYNCING DATABASES...</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl neon">Gestion des Suggestions</h2>

        {/* SÉLECTEUR DE TRI */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-50 uppercase font-bold">
            Trier par :
          </span>
          <select
            className="select select-sm select-bordered bg-black cursor-none pr-8 pl-3"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
          >
            <option value="votes">Top Votes</option>
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-[#050505] border border-gray-800 p-6 rounded-2xl hover:border-primary/30 transition-all"
          >
            {editingId === track.id ? (
              /* --- MODE ÉDITION --- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="input input-sm input-bordered"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="Titre"
                />
                <input
                  className="input input-sm input-bordered"
                  value={editForm.game}
                  onChange={(e) =>
                    setEditForm({ ...editForm, game: e.target.value })
                  }
                  placeholder="Jeu"
                />
                <input
                  className="input input-sm input-bordered"
                  value={editForm.youtube_link || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, youtube_link: e.target.value })
                  }
                  placeholder="YouTube"
                />
                <input
                  className="input input-sm input-bordered"
                  value={editForm.musescore_link || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, musescore_link: e.target.value })
                  }
                  placeholder="MuseScore"
                />
                <textarea
                  className="textarea textarea-bordered md:col-span-2"
                  value={editForm.admin_comment || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, admin_comment: e.target.value })
                  }
                  placeholder="Commentaire public (Motif de refus, encouragement...)"
                />
                <div className="flex gap-2 md:col-span-2 justify-end">
                  <button
                    onClick={() => setEditingId(null)}
                    className="btn btn-sm btn-ghost cursor-none"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveEdit}
                    className="btn btn-sm btn-primary cursor-none"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              /* --- MODE VUE --- */
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{track.title}</h3>
                    <span
                      className={`badge badge-sm ${track.status === 'retenu' ? 'badge-success' : track.status === 'rejete' ? 'badge-error' : 'badge-primary opacity-50'}`}
                    >
                      {track.status}
                    </span>
                  </div>
                  <p className="text-primary text-[10px] uppercase font-['Press_Start_2P']">
                    {track.game}
                  </p>
                  <p className="text-xs opacity-50 mt-2 italic">
                    Proposé par {track.profiles?.username} •{' '}
                    {track.votes?.length || 0} votes
                  </p>

                  {track.admin_comment && (
                    <div className="mt-3 p-3 bg-primary/5 border-l border-primary rounded text-xs">
                      <span className="font-bold text-primary">ADMIN :</span>{' '}
                      {track.admin_comment}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(track)}
                    className="btn btn-sm btn-outline cursor-none"
                  >
                    Éditer
                  </button>

                  {/* NOUVEAU : BOUTON SUPPRIMER */}
                  <button
                    onClick={() => deleteTrack(track.id, track.title)}
                    className="btn btn-sm btn-ghost text-error hover:bg-error/10 cursor-none"
                    title="Supprimer la suggestion"
                  >
                    🗑️
                  </button>

                  <select
                    className="select select-sm select-bordered cursor-none pr-8 pl-3"
                    value={track.status}
                    onChange={async (e) => {
                      await supabase
                        .from('community_tracks')
                        .update({ status: e.target.value })
                        .eq('id', track.id);
                      fetchTracks();
                    }}
                  >
                    <option value="en_vote">En vote</option>
                    <option value="retenu">Retenu</option>
                    <option value="rejete">Refusé</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
