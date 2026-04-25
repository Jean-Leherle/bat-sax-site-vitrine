import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export type Track = {
  id: number;
  title: string;
  franchise: string;
  game: string;
  arranger: string | null;
  youtube_link: string | null;
  //arrangement_status: string;
  play_status: string;
  duration: string | null;
  imageUrl: string | null;
  description: string | null;
};

export default function AdminTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [formKey, setFormKey] = useState(Date.now()); 

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    const { data } = await supabase.from("tracks").select("*").order("title", { ascending: true });
    if (data) setTracks(data);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSaveTrack = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    
    try {
      const formData = new FormData(e.currentTarget);
      const trackData = {
        title: formData.get("title") as string, 
        franchise: formData.get("franchise") as string, 
        game: formData.get("game") as string,
        arranger: formData.get("arranger") as string || null, 
        youtube_link: formData.get("youtube_link") as string || null,
        arrangement_status: formData.get("arrangement_status") as string, 
        play_status: formData.get("play_status") as string,
        duration: formData.get("duration") as string || null,
        description: formData.get("description") as string || null, 
      };
      
      if (editingTrack) {
        const { error } = await supabase.from("tracks").update(trackData).eq("id", editingTrack.id);
        if (error) throw error;
        showMessage("Morceau modifié !", "success");
        setEditingTrack(null);
      } else {
        const { error } = await supabase.from("tracks").insert([trackData]);
        if (error) throw error;
        showMessage("Morceau ajouté au catalogue !", "success");
      }
      
      setFormKey(Date.now()); // Reset instantané des champs
      await fetchTracks(); // Récupère la liste à jour
    } catch (err: any) {
      console.error(err);
      showMessage("Erreur de sauvegarde.", "error");
    } finally {
      setLoading(false); // Réactive le bouton quoi qu'il arrive !
    }
  };

  const handleDeleteTrack = async (id: number) => {
    if (!window.confirm("Supprimer ce morceau ? Il disparaîtra de toutes les setlists !")) return;
    setLoading(true);
    const { error } = await supabase.from("tracks").delete().eq("id", id); 
    if (!error) {
      showMessage("Morceau supprimé !", "success");
      setTracks(prev => prev.filter(t => t.id !== id));
    } else showMessage("Erreur suppression.", "error");
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto">
      
      {message.text && (
        <div className={`p-3 text-sm font-bold rounded text-center border ${message.type === "success" ? "border-green-500 text-green-400 bg-green-900/20" : "border-red-500 text-red-400 bg-red-900/20"}`}>
          {message.text}
        </div>
      )}

      {/* FORMULAIRE LARGE */}
      <form key={editingTrack ? `edit-${editingTrack.id}` : `new-${formKey}`} onSubmit={handleSaveTrack} className="flex flex-col gap-6 bg-[#0a0a0a] p-8 border border-gray-800 rounded-xl shadow-lg">
        <h2 className="text-primary font-bold text-xl mb-2 border-b border-gray-800 pb-2">
          {editingTrack ? "✏️ Modifier le morceau" : "➕ Ajouter au Catalogue"}
        </h2>
        
        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Titre du morceau *</span></label>
          <input type="text" name="title" defaultValue={editingTrack?.title} required className="input input-bordered input-primary bg-base-100 cursor-none" placeholder="Ex: Dire Dire Docks" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Licence (ex: Mario) *</span></label>
            <input type="text" name="franchise" defaultValue={editingTrack?.franchise} required className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Jeu vidéo (ex: Mario 64) *</span></label>
            <input type="text" name="game" defaultValue={editingTrack?.game} required className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Arrangeur (optionnel)</span></label>
            <input type="text" name="arranger" defaultValue={editingTrack?.arranger || ""} className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Durée (optionnelle, ex: 3:30)</span></label>
            <input type="text" name="duration" defaultValue={editingTrack?.duration || ""} className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* <div className="form-control">
            <label className="label"><span className="label-text opacity-70">État de l'arrangement</span></label>
            <select name="arrangement_status" defaultValue={editingTrack?.arrangement_status || "À faire"} className="select select-bordered select-primary bg-base-100 cursor-none">
              <option value="Terminé">✅ Terminé</option>
              <option value="En cours">⏳ En cours</option>
              <option value="À faire">📝 À faire</option>
            </select>
          </div> */}
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Maîtrise du jeu (Live)</span></label>
            <select name="play_status" defaultValue={editingTrack?.play_status || "Déchiffrage"} className="select select-bordered select-primary bg-base-100 cursor-none">
              <option value="Prêt">🔥 Prêt pour la scène</option>
              <option value="Déchiffrage">📖 En déchiffrage</option>
              <option value="À revoir">⚠️ À revoir</option>
            </select>
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Petite description / Anecdote (optionnelle)</span></label>
          <textarea name="description" defaultValue={editingTrack?.description || ""} className="textarea textarea-bordered textarea-primary bg-base-100 cursor-none" placeholder="Quelque chose à dire sur ce morceau ?"></textarea>
        </div>
        
        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Lien YouTube (optionnel)</span></label>
          <input type="url" name="youtube_link" defaultValue={editingTrack?.youtube_link || ""} className="input input-bordered input-primary bg-base-100 cursor-none" placeholder="https://youtube.com/..." />
        </div>
        
        <div className="flex gap-4 mt-4">
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 cursor-none hover:shadow-[0_0_15px_#00ffcc]">
            {editingTrack ? "METTRE À JOUR LE MORCEAU" : "AJOUTER AU CATALOGUE"}
          </button>
          {editingTrack && (
            <button type="button" onClick={() => setEditingTrack(null)} className="btn btn-outline cursor-none">Annuler</button>
          )}
        </div>
      </form>

      {/* LISTE DES MORCEAUX */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-2 opacity-70 border-b border-gray-800 pb-2">Tous les morceaux ({tracks.length})</h2>
        {tracks.map(t => (
          <div key={t.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#050505] border border-gray-800 rounded-xl hover:border-primary/60 transition-all duration-300 gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">{t.title}</span>
              <span className="text-xs opacity-60 mt-1 uppercase tracking-wider">{t.franchise} - {t.game}</span>
              <div className="flex gap-3 mt-2 text-xs">
                {/* <span className="bg-base-300 px-2 py-1 rounded">🎵 {t.arrangement_status}</span> */}
                <span className="bg-base-300 px-2 py-1 rounded">🎷 {t.play_status}</span>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <button onClick={() => setEditingTrack(t)} className="btn btn-sm btn-outline hover:bg-primary hover:text-black cursor-none">✏️ Éditer</button>
              <button onClick={() => handleDeleteTrack(t.id)} className="btn btn-sm btn-error btn-outline hover:bg-error hover:text-black cursor-none px-4">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}