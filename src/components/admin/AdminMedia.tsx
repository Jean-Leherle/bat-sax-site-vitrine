import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// Limite du stockage Supabase (Free Tier = 1 Go = 1073741824 octets)
const MAX_STORAGE_BYTES = 1073741824; 

// Petite fonction utilitaire pour formater les octets en Ko, Mo, Go de façon lisible
const formatBytes = (bytes?: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function AdminMedia() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalUsedSpace, setTotalUsedSpace] = useState(0);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from('batsax-media')
      .list('uploads', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      console.error(error);
    } else if (data) {
      // On filtre les dossiers fantômes éventuels (nom vide ou dossier '.emptyFolderPlaceholder')
      const validFiles = data.filter(f => f.name && f.name !== '.emptyFolderPlaceholder');
      setFiles(validFiles);
      
      // On calcule le poids total de tous les fichiers du dossier
      const usedSpace = validFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
      setTotalUsedSpace(usedSpace);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];

    // Sécurité : On vérifie si l'upload va dépasser la limite
    if (totalUsedSpace + file.size > MAX_STORAGE_BYTES) {
      alert("❌ Espace de stockage insuffisant ! Veuillez supprimer des fichiers.");
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage
      .from('batsax-media')
      .upload(filePath, file);

    if (error) {
      alert("Erreur d'upload : " + error.message);
    } else {
      fetchFiles();
    }
    setUploading(false);
  };

  const deleteFile = async (fileName: string) => {
    if (!window.confirm("Supprimer définitivement ce fichier ?")) return;

    const { error } = await supabase.storage
      .from('batsax-media')
      .remove([`uploads/${fileName}`]);

    if (error) alert("Erreur suppression");
    else fetchFiles();
  };

  const copyLink = (fileName: string) => {
    const { data } = supabase.storage
      .from('batsax-media')
      .getPublicUrl(`uploads/${fileName}`);
    
    navigator.clipboard.writeText(data.publicUrl);
    alert("Lien copié dans le presse-papier !");
  };

  // Calcul du pourcentage pour la jauge
  const storagePercentage = (totalUsedSpace / MAX_STORAGE_BYTES) * 100;
  // Détermination de la couleur de la jauge (rouge si on dépasse 90%)
  const isStorageCritical = storagePercentage > 90;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl neon mb-2">Médiathèque</h2>
          
          {/* --- NOUVEAU : JAUGE DE STOCKAGE --- */}
          <div className="flex flex-col gap-1 mt-3 w-64">
            <div className="flex justify-between text-[10px] uppercase font-bold opacity-70">
              <span>Espace utilisé</span>
              <span>{formatBytes(totalUsedSpace)} / {formatBytes(MAX_STORAGE_BYTES)}</span>
            </div>
            <progress 
              className={`progress w-full bg-base-300 ${isStorageCritical ? 'progress-error shadow-[0_0_10px_#ef4444]' : 'progress-primary'}`} 
              value={storagePercentage} 
              max="100"
            ></progress>
          </div>
        </div>

        <label className={`btn btn-primary cursor-none ${uploading ? 'loading opacity-50' : ''}`}>
          {uploading ? 'Envoi en cours...' : '➕ Uploader un fichier'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="text-center py-10 opacity-50 flex flex-col items-center gap-4">
          <span className="loading loading-spinner text-primary"></span>
          Lecture du disque...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => {
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(file.name.split('.').pop()?.toLowerCase() || '');
            const { data } = supabase.storage.from('batsax-media').getPublicUrl(`uploads/${file.name}`);
            
            return (
              <div key={file.id} className="group relative bg-[#050505] border border-gray-800 rounded-xl overflow-hidden hover:border-primary/50 transition-all flex flex-col">
                <div className="aspect-square bg-base-300 flex items-center justify-center overflow-hidden relative">
                  {isImage ? (
                    <img src={data.publicUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎬</span>
                  )}

                  {/* NOUVEAU : Affichage du poids en surimpression */}
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-gray-300 border border-gray-700 shadow-lg z-10">
                    {formatBytes(file.metadata?.size)}
                  </div>
                </div>

                {/* OVERLAY ACTIONS */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 z-20">
                  <button 
                    onClick={() => copyLink(file.name)}
                    className="btn btn-xs btn-primary w-full cursor-none"
                  >
                    Copier le lien
                  </button>
                  <button 
                    onClick={() => deleteFile(file.name)}
                    className="btn btn-xs btn-error btn-outline w-full cursor-none"
                  >
                    Supprimer
                  </button>
                </div>
                
                <div className="p-2 text-[8px] truncate opacity-50 text-center bg-black border-t border-gray-800">
                  {file.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}