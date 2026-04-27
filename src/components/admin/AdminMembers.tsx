import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

type Instrument = { name: string; photoUrl?: string };
type CustomField = { label: string; icon: string; values: string[] };

type Member = {
  id: number;
  slug: string;
  name: string;
  description: string;
  photoUrl: string;
  instruments: Instrument[];
  customFields: CustomField[];
};

const PRESET_ICONS = [
  '💬',
  '🎵',
  '🎮',
  '🥛',
  '👀',
  '🎷',
  '🎸',
  '🥁',
  '🎹',
  '🎤',
  '🎧',
  '🌟',
  '🔥',
  '💯',
  '🎬',
  '📚',
  '🍔',
  '🍻',
  '🚀',
  '❤️'
];

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [openIconPicker, setOpenIconPicker] = useState<number | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('id');
    if (data) setMembers(data as Member[]);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingMember)
      return;

    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('❌ Image trop lourde (max 2 Mo)');
      return;
    }

    setUploadingImage(true);

    try {
      const safeName = file.name.replace(/\s+/g, '_');
      const fileName = `avatars/${editingMember.slug}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('batsax-media')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('batsax-media')
        .getPublicUrl(fileName);
      setEditingMember({ ...editingMember, photoUrl: data.publicUrl });
    } catch (error: any) {
      console.error('Erreur :', error);
      alert("Erreur lors de l'upload de la photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  // --- NOUVEAU : GESTION DE L'ANNULATION ---
  const handleCancel = () => {
    if (!editingMember) return;

    const originalMember = members.find((m) => m.id === editingMember.id);

    // Si on a changé la photo pendant l'édition mais qu'on annule...
    if (originalMember && originalMember.photoUrl !== editingMember.photoUrl) {
      const originalFileName = originalMember.photoUrl
        ? originalMember.photoUrl.split('/').pop()
        : 'AUCUN_FICHIER';

      // On lance le nettoyage en tâche de fond (fire & forget)
      supabase.storage
        .from('batsax-media')
        .list('avatars', { search: editingMember.slug })
        .then(({ data: files }) => {
          if (files) {
            // On supprime TOUT ce qui appartient à ce membre SAUF son fichier d'origine
            const filesToDelete = files
              .filter(
                (f) =>
                  f.name.startsWith(`${editingMember.slug}-`) &&
                  f.name !== originalFileName
              )
              .map((f) => `avatars/${f.name}`);

            if (filesToDelete.length > 0) {
              supabase.storage.from('batsax-media').remove(filesToDelete);
              console.log(
                '🧹 Annulation : Fichiers temporaires supprimés :',
                filesToDelete
              );
            }
          }
        })
        .catch((err) => console.error('Erreur nettoyage annulation', err));
    }

    setEditingMember(null);
  };

  const addInstrument = () => {
    if (!editingMember) return;
    setEditingMember({
      ...editingMember,
      instruments: [{ name: '' }, ...editingMember.instruments]
    });
  };

  const updateInstrument = (index: number, value: string) => {
    if (!editingMember) return;
    const newInsts = [...editingMember.instruments];
    newInsts[index].name = value;
    setEditingMember({ ...editingMember, instruments: newInsts });
  };

  const removeInstrument = (index: number) => {
    if (!editingMember) return;
    const newInsts = editingMember.instruments.filter((_, i) => i !== index);
    setEditingMember({ ...editingMember, instruments: newInsts });
  };

  const addField = () => {
    if (!editingMember) return;
    const newField: CustomField = { label: '', icon: '💬', values: [''] };
    setEditingMember({
      ...editingMember,
      customFields: [newField, ...editingMember.customFields]
    });
  };

  const updateField = (index: number, key: keyof CustomField, value: any) => {
    if (!editingMember) return;
    const newFields = [...editingMember.customFields];
    (newFields[index] as any)[key] = value;
    setEditingMember({ ...editingMember, customFields: newFields });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (!editingMember) return;
    const newFields = [...editingMember.customFields];
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [
        newFields[index],
        newFields[index - 1]
      ];
    } else if (direction === 'down' && index < newFields.length - 1) {
      [newFields[index + 1], newFields[index]] = [
        newFields[index],
        newFields[index + 1]
      ];
    }
    setEditingMember({ ...editingMember, customFields: newFields });
    setOpenIconPicker(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setLoading(true);

    try {
      const cleanedInstruments = editingMember.instruments.filter(
        (inst) => inst.name.trim() !== ''
      );
      const cleanedCustomFields = editingMember.customFields
        .map((field) => ({
          ...field,
          values: field.values.filter((val) => val.trim() !== '')
        }))
        .filter(
          (field) => field.label.trim() !== '' && field.values.length > 0
        );

      const payloadToSave = {
        ...editingMember,
        instruments: cleanedInstruments,
        customFields: cleanedCustomFields
      };

      try {
        const currentFileName = payloadToSave.photoUrl.split('/').pop();
        const { data: files, error: listError } = await supabase.storage
          .from('batsax-media')
          .list('avatars', { search: payloadToSave.slug });

        if (!listError && files) {
          const filesToDelete = files
            .filter(
              (f) =>
                f.name.startsWith(`${payloadToSave.slug}-`) &&
                f.name !== currentFileName
            )
            .map((f) => `avatars/${f.name}`);

          if (filesToDelete.length > 0) {
            await supabase.storage.from('batsax-media').remove(filesToDelete);
            console.log(
              '🧹 Sauvegarde : Nettoyage des anciennes photos :',
              filesToDelete
            );
          }
        }
      } catch (cleanupError) {
        console.error('Erreur non-bloquante lors du nettoyage :', cleanupError);
      }

      const { error } = await supabase
        .from('members')
        .update(payloadToSave)
        .eq('id', payloadToSave.id);
      if (error) throw error;

      setEditingMember(null);
      fetchMembers();
      alert('✅ Profil mis à jour !');
    } catch (err: any) {
      console.error('Erreur sauvegarde :', err);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map((m) => (
          <div
            key={m.id}
            className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl flex justify-between items-center"
          >
            <span className="font-bold text-primary">{m.name}</span>
            <button
              onClick={() => setEditingMember(m)}
              className="btn btn-xs btn-primary cursor-none"
            >
              ÉDITER PROFIL
            </button>
          </div>
        ))}
      </div>

      {editingMember && (
        <form
          onSubmit={handleSave}
          className="bg-[#0a0a0a] p-8 border border-primary/30 rounded-xl flex flex-col gap-6 shadow-2xl animate-pop-in"
        >
          <h2 className="text-xl font-bold text-primary border-b border-gray-800 pb-2">
            Édition de {editingMember.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 flex flex-col items-center gap-3 bg-base-200 p-4 rounded-xl border border-gray-800">
              {editingMember.photoUrl ? (
                <img
                  src={editingMember.photoUrl}
                  alt="Profil"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center border-2 border-dashed border-gray-600">
                  <span className="text-xs opacity-50">Aucune</span>
                </div>
              )}

              <div className="form-control w-full">
                <label className="btn btn-xs btn-outline w-full cursor-none">
                  {uploadingImage ? 'UPLOAD EN COURS...' : 'CHANGER PHOTO'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                <span className="text-[9px] text-center opacity-50 mt-1">
                  Max 2 Mo (JPG/PNG)
                </span>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label-text opacity-50 mb-1">Nom</label>
                  <input
                    type="text"
                    value={editingMember.name}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        name: e.target.value
                      })
                    }
                    className="input input-bordered input-sm bg-base-100"
                  />
                </div>
                <div className="form-control">
                  <label className="label-text opacity-50 mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={editingMember.slug}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        slug: e.target.value
                      })
                    }
                    className="input input-bordered input-sm bg-base-100"
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label-text opacity-50 mb-1">
                  Description
                </label>
                <textarea
                  value={editingMember.description}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      description: e.target.value
                    })
                  }
                  className="textarea textarea-bordered bg-base-100 h-16"
                />
              </div>
            </div>
          </div>

          <div className="form-control">
            <label className="label-text opacity-50 mb-1">
              URL de la photo
            </label>
            <input
              type="text"
              value={editingMember.photoUrl}
              onChange={(e) =>
                setEditingMember({ ...editingMember, photoUrl: e.target.value })
              }
              className="input ml-2 input-bordered input-sm bg-base-200 text-gray-500"
            />
          </div>

          <div className="border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm uppercase text-gray-400">
                Instruments
              </h3>
              <button
                type="button"
                onClick={addInstrument}
                className="btn btn-sm btn-outline cursor-none"
              >
                + Ajouter un instrument
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {editingMember.instruments.map((inst, i) => (
                <div key={i} className="flex gap-2 w-full">
                  <input
                    placeholder="Ex: Saxophone Alto"
                    type="text"
                    value={inst.name}
                    onChange={(e) => updateInstrument(i, e.target.value)}
                    className="input input-bordered input-sm flex-1 bg-base-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeInstrument(i)}
                    className="btn btn-sm btn-error btn-outline cursor-none px-3"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm uppercase text-gray-400">
                Champs Personnalisés
              </h3>
              <button
                type="button"
                onClick={addField}
                className="btn btn-sm btn-outline cursor-none"
              >
                + Ajouter un champ
              </button>
            </div>

            <div className="space-y-6">
              {editingMember.customFields.map((field, i) => (
                <div
                  key={i}
                  className="p-5 bg-white/5 rounded-xl border border-gray-800 flex flex-col gap-4 relative group"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-3">
                    <div className="flex gap-1 bg-black/40 rounded px-1">
                      <button
                        type="button"
                        onClick={() => moveField(i, 'up')}
                        disabled={i === 0}
                        className="text-gray-400 hover:text-white disabled:opacity-20 cursor-none px-1"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(i, 'down')}
                        disabled={i === editingMember.customFields.length - 1}
                        className="text-gray-400 hover:text-white disabled:opacity-20 cursor-none px-1"
                      >
                        ⬇️
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newFields = editingMember.customFields.filter(
                          (_, idx) => idx !== i
                        );
                        setEditingMember({
                          ...editingMember,
                          customFields: newFields
                        });
                      }}
                      className="text-error text-xs opacity-50 hover:opacity-100 cursor-none transition-opacity"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="flex gap-3 pr-32">
                    {/* LE SÉLECTEUR D'ICÔNE */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenIconPicker(openIconPicker === i ? null : i)
                        }
                        className="btn btn-sm btn-outline w-16 text-xl bg-base-100 cursor-none"
                      >
                        {field.icon || '💬'}
                      </button>

                      {openIconPicker === i && (
                        <>
                          {/* NOUVEAU : Le Backdrop invisible qui capte le clic extérieur */}
                          <div
                            className="fixed inset-0 z-40 cursor-none"
                            onClick={() => setOpenIconPicker(null)}
                          />

                          {/* LE MENU (z-50 pour passer au-dessus du backdrop) */}
                          <div className="absolute top-10 left-0 bg-[#111] border border-primary/50 p-3 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] z-50 flex flex-wrap w-56 gap-2">
                            {PRESET_ICONS.map((icon) => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => {
                                  updateField(i, 'icon', icon);
                                  setOpenIconPicker(null);
                                }}
                                className="hover:bg-primary/30 p-1 rounded text-xl cursor-none transition-colors"
                              >
                                {icon}
                              </button>
                            ))}
                            <div className="w-full border-t border-gray-700 my-1"></div>
                            <div className="flex items-center gap-2 w-full px-1 relative z-50">
                              <span className="text-[10px] opacity-50 uppercase">
                                Autre:
                              </span>
                              <input
                                type="text"
                                value={field.icon}
                                maxLength={5}
                                onChange={(e) =>
                                  updateField(i, 'icon', e.target.value)
                                }
                                className="input input-bordered input-xs w-full bg-black text-center"
                                placeholder="Emoji..."
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <input
                      placeholder="Titre du champ (ex: Jeu Préféré)"
                      value={field.label}
                      onChange={(e) => updateField(i, 'label', e.target.value)}
                      className="input input-bordered input-sm flex-1 bg-base-100 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pl-4 border-l-2 border-gray-700">
                    {field.values.map((val, vi) => (
                      <div key={vi} className="flex gap-2 w-full">
                        <input
                          placeholder="Valeur ou ligne de texte..."
                          value={val}
                          onChange={(e) => {
                            const newVals = [...field.values];
                            newVals[vi] = e.target.value;
                            updateField(i, 'values', newVals);
                          }}
                          className="input input-bordered input-sm flex-1 italic text-primary bg-base-100"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newVals = field.values.filter(
                              (_, vIndex) => vIndex !== vi
                            );
                            updateField(i, 'values', newVals);
                          }}
                          className="btn btn-sm btn-ghost text-gray-500 hover:text-error px-2 cursor-none"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newVals = [...field.values, ''];
                        updateField(i, 'values', newVals);
                      }}
                      className="btn btn-sm btn-outline border-dashed border-gray-700 opacity-50 hover:opacity-100 cursor-none mt-1"
                    >
                      + Ajouter une ligne
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="btn btn-primary flex-1 cursor-none"
            >
              SAUVEGARDER LE PROFIL
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline cursor-none"
            >
              ANNULER
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
