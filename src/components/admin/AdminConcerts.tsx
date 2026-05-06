import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import type { Concert } from '../../pages/Stages'; 

const getYoutubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

const isValidUrl = (string: string) => {
  try { new URL(string); return true; } 
  catch (_) { return false; }
};

export const extractDateTime = (c: Concert | null) => {
  if (!c || !c.date) return { date: '', time: '' };
  const datePart = c.date.split(/[\sT]/)[0];
  let timePart = '';
  if (c.date.includes('T') || c.date.includes(' ')) {
    const extractedTime = c.date.split(/[\sT]/)[1]?.slice(0, 5);
    if (extractedTime && extractedTime !== '00:00') timePart = extractedTime;
  }
  return { date: datePart, time: timePart };
};

export default function AdminConcerts() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingConcert, setEditingConcert] = useState<Concert | null>(null);
  const [formKey, setFormKey] = useState(Date.now());

  const [dynamicImages, setDynamicImages] = useState<string[]>([]);
  const [dynamicVideos, setDynamicVideos] = useState<string[]>([]);

  useEffect(() => { fetchConcerts(); }, []);

  useEffect(() => {
    if (editingConcert) {
      setDynamicImages(editingConcert.imageUrl || []);
      setDynamicVideos(editingConcert.videoUrl || []);
    } else {
      setDynamicImages([]);
      setDynamicVideos([]);
    }
  }, [editingConcert]);

  const fetchConcerts = async () => {
    const { data } = await supabase.from('concerts').select('*').order('date', { ascending: false });
    if (data) setConcerts(data as Concert[]);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const updateDynamicList = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], index: number, val: string) => {
    const newList = [...list]; newList[index] = val; setter(newList);
  };
  const removeFromDynamicList = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], index: number) => {
    setter(list.filter((_, i) => i !== index));
  };

  const handleSaveConcert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData(e.currentTarget);
      const rawDate = formData.get('date') as string;
      const rawTime = formData.get('time') as string;
      const combinedTimestamp = `${rawDate}T${rawTime || '00:00'}:00`;

      // 1. Nettoyage
      const cleanImages = dynamicImages.filter(url => url.trim() !== '');
      const cleanVideos = dynamicVideos.filter(url => url.trim() !== '');

      // 2. Validation basique des URLs (l'aperçu visuel fait le gros du travail de vérification pour l'utilisateur)
      for (const vid of cleanVideos) if (!isValidUrl(vid)) throw new Error(`L'URL de la vidéo est invalide : ${vid}`);
      for (const img of cleanImages) if (!isValidUrl(img)) throw new Error(`L'URL de l'image est invalide : ${img}`);

      const concertData = {
        name: formData.get('name') as string,
        date: combinedTimestamp,
        location: formData.get('location') as string,
        description: (formData.get('description') as string) || null,
        locationLink: (formData.get('locationLink') as string) || null,
        imageUrl: cleanImages,
        videoUrl: cleanVideos
      };

      if (editingConcert) {
        const { error } = await supabase.from('concerts').update(concertData).eq('id', editingConcert.id);
        if (error) throw error;
        showMessage('Concert modifié !', 'success');
        setEditingConcert(null);
      } else {
        const { error } = await supabase.from('concerts').insert([concertData]);
        if (error) throw error;
        showMessage('Concert ajouté !', 'success');
      }

      setFormKey(Date.now());
      await fetchConcerts();
    } catch (err: any) {
      console.error(err);
      showMessage(err.message || 'Erreur de sauvegarde.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConcert = async (id: number) => {
    if (!window.confirm('Supprimer ce concert ?')) return;
    setLoading(true);
    const { error } = await supabase.from('concerts').delete().eq('id', id);
    if (!error) {
      showMessage('Concert supprimé !', 'success');
      setConcerts((prev) => prev.filter((c) => c.id !== id));
    } else showMessage('Erreur suppression.', 'error');
    setLoading(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    try { return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } 
    catch { return dateString; }
  };

  const editVals = extractDateTime(editingConcert);

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto pb-12">
      {message.text && (
        <div className={`p-3 text-sm font-bold rounded text-center border ${message.type === 'success' ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-red-500 text-red-400 bg-red-900/20'}`}>
          {message.text}
        </div>
      )}

      <form key={editingConcert ? `edit-${editingConcert.id}` : `new-${formKey}`} onSubmit={handleSaveConcert} className="flex flex-col gap-8 bg-[#0a0a0a] p-8 border border-primary/30 rounded-xl shadow-2xl animate-pop-in">
        <h2 className="text-primary font-bold text-xl border-b border-gray-800 pb-2">
          {editingConcert ? '✏️ Modifier le concert' : '➕ Ajouter un Concert'}
        </h2>

        {/* --- INFOS GÉNÉRALES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label-text opacity-70 mb-2">Nom du concert *</label>
            <input type="text" name="name" defaultValue={editingConcert?.name} required className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
          <div className="form-control">
            <label className="label-text opacity-70 mb-2">Lieu *</label>
            <input type="text" name="location" defaultValue={editingConcert?.location} required className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label-text opacity-70 mb-2">Date *</label>
            <input type="date" name="date" defaultValue={editVals.date} required className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
          <div className="form-control">
            <label className="label-text opacity-70 mb-2">Heure (optionnelle)</label>
            <input type="time" name="time" defaultValue={editVals.time} className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
        </div>

        <div className="form-control">
          <label className="label-text opacity-70 mb-2">Lien Google Maps (optionnel)</label>
          <input type="url" name="locationLink" defaultValue={editingConcert?.locationLink || ''} className="input input-bordered input-primary bg-base-100 cursor-none" />
        </div>

        <div className="form-control">
          <label className="label-text opacity-70 mb-2">Description / Mot d'ambiance</label>
          <textarea name="description" defaultValue={editingConcert?.description || ''} className="textarea textarea-bordered textarea-primary bg-base-100 cursor-none h-24" />
        </div>

        {/* --- MÉDIAS : IMAGES --- */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm uppercase text-gray-400">🖼️ Photos du concert</h3>
            <button type="button" onClick={() => setDynamicImages([...dynamicImages, ''])} className="btn btn-sm btn-outline cursor-none">
              + Ajouter
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {dynamicImages.length === 0 && <span className="text-xs opacity-40 italic">Aucune photo pour le moment.</span>}
            {dynamicImages.map((url, i) => (
              <div key={i} className="flex gap-3 w-full items-center relative">
                {/* APERÇU MINIATURE IMAGE */}
                <div className="w-12 h-12 shrink-0 rounded bg-base-300 border border-gray-700 overflow-hidden flex items-center justify-center">
                  {url ? (
                    <img 
                      src={url} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/333/f00?text=Erreur"; }}
                    />
                  ) : (
                    <span className="text-[10px] opacity-30">Vide</span>
                  )}
                </div>

                <div className="flex-1 flex gap-2 relative">
                  {i === 0 && (
                    <span className="absolute -top-4 left-0 text-primary text-[9px] font-bold z-10">
                      IMAGE PRINCIPALE (AFFICHE)
                    </span>
                  )}
                  <input 
                    type="url" 
                    value={url} 
                    onChange={(e) => updateDynamicList(setDynamicImages, dynamicImages, i, e.target.value)} 
                    placeholder="https://..." 
                    className="input input-bordered input-sm flex-1 bg-base-100" 
                  />
                  <button type="button" onClick={() => removeFromDynamicList(setDynamicImages, dynamicImages, i)} className="btn btn-sm btn-error btn-outline cursor-none px-3">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- MÉDIAS : VIDÉOS --- */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm uppercase text-gray-400">🎬 Vidéos (YouTube, mp4...)</h3>
            <button type="button" onClick={() => setDynamicVideos([...dynamicVideos, ''])} className="btn btn-sm btn-outline cursor-none">
              + Ajouter
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {dynamicVideos.length === 0 && <span className="text-xs opacity-40 italic">Aucune vidéo pour le moment.</span>}
            {dynamicVideos.map((url, i) => {
              const ytId = getYoutubeId(url);
              return (
                <div key={i} className="flex gap-3 w-full items-center">
                  {/* APERÇU MINIATURE VIDÉO */}
                  <div className="w-16 h-12 shrink-0 rounded bg-base-300 border border-gray-700 overflow-hidden flex items-center justify-center relative">
                    {ytId ? (
                      <img 
                        src={`https://img.youtube.com/vi/${ytId}/default.jpg`} 
                        alt="YT" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/100x75/333/f00?text=Erreur"; }}
                      />
                    ) : url ? (
                      <video src={url} className="w-full h-full object-cover" muted preload="metadata" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className="text-[10px] opacity-30">Vide</span>
                    )}
                  </div>

                  <div className="flex-1 flex gap-2">
                    <input 
                      type="url" 
                      value={url} 
                      onChange={(e) => updateDynamicList(setDynamicVideos, dynamicVideos, i, e.target.value)} 
                      placeholder="Lien YouTube ou mp4" 
                      className="input input-bordered input-sm flex-1 bg-base-100" 
                    />
                    <button type="button" onClick={() => removeFromDynamicList(setDynamicVideos, dynamicVideos, i)} className="btn btn-sm btn-error btn-outline cursor-none px-3">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 cursor-none hover:shadow-[0_0_15px_#00ffcc]">
            {loading ? 'SAUVEGARDE...' : (editingConcert ? 'METTRE À JOUR' : 'ENREGISTRER')}
          </button>
          {editingConcert && (
            <button type="button" onClick={() => setEditingConcert(null)} className="btn btn-outline cursor-none">Annuler</button>
          )}
        </div>
      </form>

      {/* --- LISTE DES CONCERTS --- */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-2 opacity-70 border-b border-gray-800 pb-2">Liste des Concerts</h2>
        {concerts.map((c) => {
          const displayVals = extractDateTime(c);
          return (
            <div key={c.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#050505] border border-gray-800 rounded-xl hover:border-primary/60 transition-all duration-300 gap-4">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">{c.name}</span>
                <span className="text-sm opacity-70 mt-1">
                  📅 {formatDateForDisplay(displayVals.date)} {displayVals.time && `à ${displayVals.time.replace(':', 'h')}`} | 📍 {c.location}
                </span>
                <span className="text-xs opacity-50 mt-2 flex gap-3">
                  <span>🖼️ {c.imageUrl?.length || 0} photo(s)</span>
                  <span>🎬 {c.videoUrl?.length || 0} vidéo(s)</span>
                </span>
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button onClick={() => setEditingConcert(c)} className="btn btn-sm btn-outline hover:bg-primary hover:text-black cursor-none">✏️ Éditer</button>
                <button onClick={() => handleDeleteConcert(c.id)} className="btn btn-sm btn-error btn-outline hover:bg-error hover:text-black cursor-none px-4">🗑️</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}