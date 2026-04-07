import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MiniGame from "../components/MiniGame";
import { CREDITS_UNLOCK_SCORE } from "../hooks/useMiniGame"; 

export default function Lobby() {
  const [creditsUnlocked, setCreditsUnlocked] = useState(false);

  useEffect(() => {
    const isUnlocked = localStorage.getItem("batsax-credits-unlocked");
    if (isUnlocked === "true") {
      setCreditsUnlocked(true);
    }
  }, []);

  const handleScoreUpdate = (score: number) => {
    if (score >= CREDITS_UNLOCK_SCORE && !creditsUnlocked) {
      setCreditsUnlocked(true);
      localStorage.setItem("batsax-credits-unlocked", "true"); 
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[70vh]">
      
      <MiniGame onScoreUpdate={handleScoreUpdate} />

      <div className="text-center flex flex-col items-center gap-8 z-10 p-6 bg-black/40 rounded-3xl backdrop-blur-sm border border-gray-900 transition-all duration-500">
        <h1 className="text-4xl neon">BatSax</h1>

        <p className="text-sm opacity-70 max-w-md">
          Trio de saxophones + batterie dédié aux musiques de jeux vidéo.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Link to="/next" className="btn btn-primary">
            ▶ Prochain boss
          </Link>
          <Link to="/saves" className="btn btn-outline">
            Sauvegardes précédentes
          </Link>

          {creditsUnlocked && (
            <Link 
              to="/credits" 
              className="btn btn-outline border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all animate-bounce"
            >
              ⭐ CREDITS
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}