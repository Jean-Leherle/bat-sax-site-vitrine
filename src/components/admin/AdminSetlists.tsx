import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { type  Concert } from "./AdminConcerts";
import { type Track } from "./AdminTracks";

type ConcertTrack = {
  track_id: number;
  concert_id: number;
  play_order: number;
  is_secret: boolean;
  tracks: Track;
};

const isConcertTrackArray = (data: unknown): data is ConcertTrack[] => {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) => item && typeof item === 'object' && 'track_id' in item && 'tracks' in item
  );
};

export default function AdminSetlists() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedConcertId, setSelectedConcertId] = useState<number | null>(null);
  const [currentSetlist, setCurrentSetlist] = useState<ConcertTrack[]>([]);

  useEffect(() => {
    fetchConcerts();
    fetchTracks();
  }, []);

  const fetchConcerts = async () => {
    const { data } = await supabase.from('concerts').select('*').order('date', { ascending: false });
    if (data) setConcerts(data);
  };

  const fetchTracks = async () => {
    const { data } = await supabase.from('tracks').select('*').order('title', { ascending: true });
    if (data) setTracks(data);
  };

  const fetchSetlist = async (concertId: number) => {
    const { data, error } = await supabase
      .from('concert_tracks')
      .select('*, tracks(*)')
      .eq('concert_id', concertId)
      .order('play_order', { ascending: true });

    if (error) console.error(error);
    else if (isConcertTrackArray(data)) setCurrentSetlist(data);
  };

  const handleAddToSetlist = async (trackId: number) => {
    if (!selectedConcertId) return;
    // On met le nouveau morceau à la fin (l'ordre max actuel + 1)
    const order = currentSetlist.length > 0 ? Math.max(...currentSetlist.map(ct => ct.play_order)) + 1 : 1;
    const { error } = await supabase.from('concert_tracks').insert([{ concert_id: selectedConcertId, track_id: trackId, play_order: order }]);
    if (!error) fetchSetlist(selectedConcertId);
  };

  const handleRemoveFromSetlist = async (trackId: number) => {
    if (!selectedConcertId) return;
    const { error } = await supabase.from('concert_tracks').delete().match({ concert_id: selectedConcertId, track_id: trackId });
    if (!error) fetchSetlist(selectedConcertId);
  };

  const toggleSecret = async (trackId: number, currentStatus: boolean) => {
    if (!selectedConcertId) return;
    const { error } = await supabase.from('concert_tracks').update({ is_secret: !currentStatus }).match({ concert_id: selectedConcertId, track_id: trackId });
    if (!error) fetchSetlist(selectedConcertId);
  };

  // ==========================================
  // NOUVEAU : Fonction de réorganisation
  // ==========================================
  const moveTrack = async (currentIndex: number, direction: 'up' | 'down') => {
    if (!selectedConcertId) return;
    if (direction === 'up' && currentIndex === 0) return; // Déjà tout en haut
    if (direction === 'down' && currentIndex === currentSetlist.length - 1) return; // Déjà tout en bas

    const trackA = currentSetlist[currentIndex];
    const trackB = currentSetlist[direction === 'up' ? currentIndex - 1 : currentIndex + 1];

    // On échange les valeurs de play_order des deux morceaux
    const { error: errorA } = await supabase
      .from('concert_tracks')
      .update({ play_order: trackB.play_order })
      .match({ concert_id: selectedConcertId, track_id: trackA.track_id });

    const { error: errorB } = await supabase
      .from('concert_tracks')
      .update({ play_order: trackA.play_order })
      .match({ concert_id: selectedConcertId, track_id: trackB.track_id });

    if (!errorA && !errorB) {
      fetchSetlist(selectedConcertId);
    } else {
      console.error("Erreur lors du déplacement", errorA || errorB);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="form-control bg-[#0a0a0a] p-6 border border-primary/30 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.05)]">
        <label className="label">
          <span className="label-text text-lg font-bold">Choisir un concert pour modifier sa Setlist :</span>
        </label>
        <select
          className="select select-bordered select-primary w-full bg-base-100 text-lg cursor-none transition-colors hover:border-white focus:border-white"
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelectedConcertId(id);
            if (id) fetchSetlist(id);
          }}
          value={selectedConcertId || ''}
        >
          <option value="" disabled>--- Sélectionnez un événement ---</option>
          {concerts.map((c) => <option key={c.id} value={c.id}>{c.date} - {c.name}</option>)}
        </select>
      </div>

      {selectedConcertId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne de gauche : Setlist actuelle */}
          <div className="bg-[#050505] p-5 border border-gray-800 rounded-xl shadow-lg">
            <h3 className="text-primary font-bold text-xl mb-4 border-b border-gray-800 pb-3">🎶 Setlist du concert</h3>
            <div className="flex flex-col gap-3">
              {currentSetlist.length === 0 && <p className="text-sm opacity-50 text-center py-4">Aucun morceau sélectionné.</p>}
              
              {currentSetlist.map((ct, index) => (
                <div key={ct.track_id} className="flex justify-between items-center bg-base-200 p-2 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                  
                  <div className="flex items-center gap-3">
                    {/* LES BOUTONS HAUT / BAS */}
                    <div className="flex flex-col gap-0.5">
                      <button 
                        onClick={() => moveTrack(index, 'up')}
                        disabled={index === 0}
                        className="text-[10px] opacity-50 hover:opacity-100 px-2 disabled:opacity-10 hover:text-primary cursor-none transition-opacity"
                        title="Monter"
                      >▲</button>
                      <button 
                        onClick={() => moveTrack(index, 'down')}
                        disabled={index === currentSetlist.length - 1}
                        className="text-[10px] opacity-50 hover:opacity-100 disabled:opacity-10 hover:text-primary cursor-none transition-opacity"
                        title="Descendre"
                      >▼</button>
                    </div>

                    <span className="opacity-50 text-xs font-['Press_Start_2P'] w-4 text-right">{index + 1}.</span>
                    <span className={`text-sm font-bold ${ct.is_secret ? 'text-purple-400 drop-shadow-[0_0_5px_#c084fc]' : 'text-white'}`}>
                      {ct.tracks.title}
                    </span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleSecret(ct.track_id, ct.is_secret)}
                      className={`btn btn-xs cursor-none transition-all px-2 ${ct.is_secret ? 'btn-secondary shadow-[0_0_10px_#d946ef]' : 'btn-outline border-gray-600 hover:border-secondary hover:text-secondary'}`}
                      title={ct.is_secret ? 'Passer en Public' : 'Rendre Secret'}
                    >
                      ❓
                    </button>
                    <button onClick={() => handleRemoveFromSetlist(ct.track_id)} className="btn btn-xs btn-error btn-outline cursor-none hover:bg-error hover:text-black transition-colors px-2">
                      -
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne de droite : Catalogue pour ajout */}
          <div className="bg-[#050505] p-5 border border-gray-800 rounded-xl shadow-lg">
            <h3 className="text-green-400 font-bold text-xl mb-4 border-b border-gray-800 pb-3">➕ Ajouter depuis le catalogue</h3>
            <div className="flex flex-col gap-2 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {tracks.map((t) => {
                const isAlreadyIn = currentSetlist.some((ct) => ct.track_id === t.id);
                return (
                  <div key={t.id} className={`flex justify-between items-center p-3 rounded-lg border transition-colors duration-300 ${isAlreadyIn ? 'opacity-30 border-transparent bg-transparent' : 'bg-base-200 border-gray-800 hover:border-green-500/50'}`}>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{t.title}</span>
                      <span className="text-[10px] opacity-60 uppercase">{t.game}</span>
                    </div>
                    {!isAlreadyIn && (
                      <button onClick={() => handleAddToSetlist(t.id)} className="btn btn-sm btn-success cursor-none hover:shadow-[0_0_10px_#22c55e] px-4">+</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}