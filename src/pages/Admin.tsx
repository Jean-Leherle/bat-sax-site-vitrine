import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

type Concert = {
  id: number;
  name: string;
  date: string;
  time: string | null;
  location: string;
  locationLink?: string; 
};

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [concerts, setConcerts] = useState<Concert[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
      } else {
        setIsCheckingAuth(false);
        fetchConcerts(); 
      }
    };
    
    checkUser();
  }, [navigate]);

  const fetchConcerts = async () => {
    const { data, error } = await supabase
      .from("concerts")
      .select("id, name, date, time, location, locationLink")
      .order("date", { ascending: false });

    if (!error && data) {
      setConcerts(data);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce concert (DANGER) ?");
    if (!confirmDelete) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    const { error } = await supabase
      .from("concerts")
      .delete()
      .eq("id", id); 

    setLoading(false);

    if (error) {
      console.error("Erreur lors de la suppression :", error);
      setMessage({ text: "Erreur lors de la suppression.", type: "error" });
    } else {
      setMessage({ text: "Concert supprimé ! 💥", type: "success" });
      
      // --- FIX : On filtre la liste locale instantanément au lieu de refaire une requête ---
      setConcerts(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const formData = new FormData(e.currentTarget);
    const newConcert = {
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string || null,
      location: formData.get("location") as string,
      locationLink: formData.get("locationLink") as string || null,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string,
      videoUrl: formData.get("videoUrl") as string,
    };
    
    // --- FIX : On ajoute .select() pour que Supabase nous renvoie la ligne qu'il vient de créer ---
    const { data, error } = await supabase.from("concerts").insert([newConcert]).select();

    setLoading(false);

    if (error) {
      console.error("Erreur lors de l'ajout :", error);
      setMessage({ text: "Erreur lors de l'ajout. Vérifiez la console.", type: "error" });
    } else if (data) {
      setMessage({ text: "Concert ajouté avec succès ! 🎷", type: "success" });
      e.currentTarget.reset();
      
      // --- FIX : On injecte le nouveau concert directement dans l'interface et on retrie par date ---
      setConcerts(prev => {
        const updatedList = [data[0], ...prev];
        return updatedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    }
  };

  if (isCheckingAuth) {
    return <div className="p-6 text-center neon mt-12">Vérification des habilitations...</div>;
  }

  return (
    <div className="p-6 w-full max-w-2xl mx-auto">
      <h1 className="neon mb-8 text-2xl text-center">Add New Stage</h1>

      {message.text && (
        <div className={`p-4 mb-6 rounded text-center border ${message.type === "success" ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-[#0a0a0a] p-6 border border-gray-800 rounded-xl mb-12">
        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Nom du concert *</span></label>
          <input type="text" name="name" required className="input input-bordered input-primary w-full bg-base-100" placeholder="Ex: Fête de la musique" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Date *</span></label>
            <input type="date" name="date" required className="input input-bordered input-primary w-full bg-base-100" />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Heure (optionnel)</span></label>
            <input type="time" name="time" className="input input-bordered input-primary w-full bg-base-100" />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Lieu (Nom usuel) *</span></label>
            <input type="text" name="location" required className="input input-bordered input-primary w-full bg-base-100" placeholder="Ex: Le Cube - Troyes" />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Lien Google Maps (optionnel)</span></label>
          <input type="url" name="locationLink" className="input input-bordered input-primary w-full bg-base-100" placeholder="https://maps.app.goo.gl/..." />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Description (optionnel)</span></label>
          <textarea name="description" className="textarea textarea-bordered textarea-primary w-full bg-base-100" placeholder="Petite description du concert..."></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">URL de l'image (optionnel)</span></label>
            <input type="url" name="imageUrl" className="input input-bordered input-primary w-full bg-base-100" placeholder="https://..." />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">URL de la vidéo (optionnel)</span></label>
            <input type="url" name="videoUrl" className="input input-bordered input-primary w-full bg-base-100" placeholder="https://youtube.com/..." />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary mt-4 font-['Press_Start_2P'] text-[10px] tracking-widest cursor-none">
          {loading ? "SAVING..." : "SAVE DATA"}
        </button>
      </form>

      <h2 className="neon mb-4 text-xl text-center text-red-400">Danger Zone : Delete Stages</h2>
      
      <div className="flex flex-col gap-3">
        {concerts.length === 0 ? (
          <p className="text-center opacity-50 text-sm">Aucun concert trouvé.</p>
        ) : (
          concerts.map((c) => (
            <div key={c.id} className="flex justify-between items-center p-4 bg-[#050505] border border-gray-800 rounded-xl hover:border-red-900 transition-colors">
              <div>
                <h3 className="text-primary font-bold text-sm">{c.name}</h3>
                <p className="text-xs opacity-70 mt-1">
                  📅 {c.date} {c.time && `à ${c.time}`} | 📍 {c.location}
                </p>
                {c.locationLink && (
                  <a href={c.locationLink} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1 inline-block">
                    [Lien Maps Actif]
                  </a>
                )}
              </div>
              
              <button 
                onClick={() => handleDelete(c.id)}
                disabled={loading}
                className="btn btn-xs btn-outline border-red-500 text-red-500 hover:bg-red-500 hover:text-black cursor-none"
              >
                DELETE
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}