import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import type { Concert } from '../../pages/Stages'; 



export const extractDateTime = (c: Concert | null) => {
  if (!c || !c.date) return { date: '', time: '' };
  
  const datePart = c.date.split(/[\sT]/)[0];
  let timePart = '';
  
  if (c.date.includes('T') || c.date.includes(' ')) {
    const extractedTime = c.date.split(/[\sT]/)[1]?.slice(0, 5);
    // Règle d'or : Si ce n'est pas minuit, c'est qu'il y a une heure définie
    if (extractedTime && extractedTime !== '00:00') {
      timePart = extractedTime;
    }
  }

  return { date: datePart, time: timePart };
};

export default function AdminConcerts() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingConcert, setEditingConcert] = useState<Concert | null>(null);
  const [formKey, setFormKey] = useState(Date.now());

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    const { data } = await supabase.from('concerts').select('*').order('date', { ascending: false });
    if (data) setConcerts(data);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSaveConcert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData(e.currentTarget);
      const rawDate = formData.get('date') as string;
      const rawTime = formData.get('time') as string;

      // FUSION : On recrée un Timestamp valide. S'il n'y a pas d'heure, on force 00:00.
      const combinedTimestamp = `${rawDate}T${rawTime || '00:00'}:00`;

      const concertData = {
        name: formData.get('name') as string,
        date: combinedTimestamp, // On envoie tout dans la même colonne
        location: formData.get('location') as string,
        locationLink: (formData.get('locationLink') as string) || null
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
      showMessage('Erreur de sauvegarde.', 'error');
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
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const editVals = extractDateTime(editingConcert);

  return (
    <div className="flex flex-col gap-12 max-w-3xl mx-auto">
      {message.text && (
        <div className={`p-3 text-sm font-bold rounded text-center border ${message.type === 'success' ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-red-500 text-red-400 bg-red-900/20'}`}>
          {message.text}
        </div>
      )}

      <form key={editingConcert ? `edit-${editingConcert.id}` : `new-${formKey}`} onSubmit={handleSaveConcert} className="flex flex-col gap-6 bg-[#0a0a0a] p-8 border border-gray-800 rounded-xl shadow-lg">
        <h2 className="text-primary font-bold text-xl mb-2 border-b border-gray-800 pb-2">
          {editingConcert ? '✏️ Modifier le concert' : '➕ Ajouter un Concert'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Nom du concert *</span></label>
            <input type="text" name="name" defaultValue={editingConcert?.name} required className="input input-bordered input-primary bg-base-100 cursor-none" placeholder="Ex: Fête de la Musique" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Lieu *</span></label>
            <input type="text" name="location" defaultValue={editingConcert?.location} required className="input input-bordered input-primary bg-base-100 cursor-none" placeholder="Ex: Le Cube - Troyes" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Date *</span></label>
            <input type="date" name="date" defaultValue={editVals.date} required className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Heure (optionnelle)</span></label>
            <input type="time" name="time" defaultValue={editVals.time} className="input input-bordered input-primary bg-base-100 cursor-none" />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Lien Google Maps (optionnel)</span></label>
          <input type="url" name="locationLink" defaultValue={editingConcert?.locationLink || ''} className="input input-bordered input-primary bg-base-100 cursor-none" placeholder="https://maps.app.goo.gl/..." />
        </div>

        <div className="flex gap-4 mt-4">
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 cursor-none hover:shadow-[0_0_15px_#00ffcc]">
            {editingConcert ? 'METTRE À JOUR LE CONCERT' : 'ENREGISTRER LE CONCERT'}
          </button>
          {editingConcert && <button type="button" onClick={() => setEditingConcert(null)} className="btn btn-outline cursor-none">Annuler</button>}
        </div>
      </form>

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