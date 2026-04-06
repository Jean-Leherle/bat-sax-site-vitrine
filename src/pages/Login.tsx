import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Identifiants incorrects.");
    } else {
      // Si c'est un succès, on redirige vers la page admin
      navigate("/admin");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 mt-12 w-full max-w-md mx-auto">
      <h1 className="neon text-2xl mb-8">Admin Login</h1>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full bg-[#0a0a0a] p-6 border border-gray-800 rounded-xl">
        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Email</span></label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered input-primary w-full bg-base-100" 
            required 
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text opacity-70">Mot de passe</span></label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered input-primary w-full bg-base-100" 
            required 
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary mt-4 font-['Press_Start_2P'] text-[10px]">
          {loading ? "LOADING..." : "LOGIN"}
        </button>
      </form>
    </div>
  );
}