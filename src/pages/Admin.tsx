import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom"; // On importe useNavigate

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Vérification de la connexion au chargement de la page
  useEffect(() => {
    const checkUser = async () => {
      // On demande à Supabase s'il y a une session active
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si aucune session, on redirige vers le login
        navigate("/login");
      } else {
        // Si on est connecté, on arrête le chargement et on affiche la page
        setIsCheckingAuth(false);
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const formData = new FormData(e.currentTarget);
    const newConcert = {
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      location: formData.get("location") as string,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string,
      videoUrl: formData.get("videoUrl") as string,
    };

    const { error } = await supabase.from("concerts").insert([newConcert]);

    setLoading(false);

    if (error) {
      console.error("Erreur lors de l'ajout :", error);
      setMessage({ text: "Erreur lors de l'ajout. Vérifiez la console.", type: "error" });
    } else {
      setMessage({ text: "Concert ajouté avec succès ! 🎷", type: "success" });
      navigate('/')
      e.currentTarget.reset();

    }
  };

  // Pendant qu'on vérifie si tu es connecté, on affiche un petit message
  if (isCheckingAuth) {
    return <div className="p-6 text-center neon mt-12">Vérification des habilitations...</div>;
  }

  // Si on arrive ici, c'est que tu es bien connecté ! On affiche le formulaire.
  return (
    <div className="p-6 w-full max-w-2xl mx-auto">
      <h1 className="neon mb-8 text-2xl text-center">Add New Stage</h1>

      {message.text && (
        <div className={`p-4 mb-6 rounded text-center border ${message.type === "success" ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-[#0a0a0a] p-6 border border-gray-800 rounded-xl">
        
        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Nom du concert *</span></label>
          <input type="text" name="name" required className="input input-bordered input-primary w-full bg-base-100" placeholder="Ex: Fête de la musique" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Date *</span></label>
            <input type="date" name="date" required className="input input-bordered input-primary w-full bg-base-100" />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text opacity-70">Lieu *</span></label>
            <input type="text" name="location" required className="input input-bordered input-primary w-full bg-base-100" placeholder="Ex: Troyes" />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Description (optionnel)</span></label>
          <textarea name="description" className="textarea textarea-bordered textarea-primary w-full bg-base-100" placeholder="Petite description du concert..."></textarea>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">URL de l'image (optionnel)</span></label>
          <input type="url" name="imageUrl" className="input input-bordered input-primary w-full bg-base-100" placeholder="https://..." />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">URL de la vidéo (optionnel)</span></label>
          <input type="url" name="videoUrl" className="input input-bordered input-primary w-full bg-base-100" placeholder="https://youtube.com/..." />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary mt-4 font-['Press_Start_2P'] text-[10px] tracking-widest cursor-none">
          {loading ? "SAVING..." : "SAVE DATA"}
        </button>
      </form>
    </div>
  );
}