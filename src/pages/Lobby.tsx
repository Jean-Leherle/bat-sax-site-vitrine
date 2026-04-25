import { useState, useEffect, useRef, useCallback } from "react"; // Ne pas oublier d'importer useCallback !
import { Link } from "react-router-dom";
import MiniGame from "../components/MiniGame";
import { CREDITS_UNLOCK_SCORE } from "../hooks/useMiniGame"; 
import { useAudio } from "../contexts/AudioContext"; 

export default function Lobby() {
  const [creditsUnlocked, setCreditsUnlocked] = useState(false);
  
  // On importe 'pause' de notre hook Audio !
  const { isPlaying, playRandomTrack, play, pause } = useAudio();
  
  const isPlayingRef = useRef(isPlaying);
const wasPlayingOnHiddenRef = useRef(false);

  const autoPlayAttempted = useRef(false);
  const bossMusicPlayed = useRef(false); 
  const inactivityTimerRef = useRef<number | null>(null);

  useEffect(() => {
  isPlayingRef.current = isPlaying;
}, [isPlaying]);

  // Fonction qui (re)lance le compte à rebours de 120s
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    
    inactivityTimerRef.current = window.setTimeout(() => {
      // 2000ms = Le son va mourir en douceur sur 2 secondes
      pause(2000); 
    }, 30000); // 120 000 ms = 120 secondes
  }, [pause]);

  useEffect(() => {
  const activityEvents = ['keydown', 'mousemove', 'mousedown', 'touchstart'];
  const handleActivity = () => resetInactivityTimer();

  activityEvents.forEach(event => window.addEventListener(event, handleActivity));
  resetInactivityTimer();

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // On sauvegarde l'état actuel avant de forcer la pause
      wasPlayingOnHiddenRef.current = isPlayingRef.current;
      pause(300); 
    } else {
      resetInactivityTimer();
      // On relance UNIQUEMENT si ça jouait avant que l'onglet soit masqué
      if (wasPlayingOnHiddenRef.current) {
        play();
      }
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    pause(300); 
  };
}, [resetInactivityTimer, pause, play]);
  // ---------------------------------------------------------------------

  useEffect(() => {
    const isUnlocked = localStorage.getItem("batsax-credits-unlocked");
    if (isUnlocked === "true") {
      setCreditsUnlocked(true);
    }

    playRandomTrack([
      { title: "sans.", url: "/music/sans.ogg" }
    ]);
  }, [playRandomTrack]);

const handleScoreUpdate = (score: number) => {
  if (score >= CREDITS_UNLOCK_SCORE && !creditsUnlocked) {
    setCreditsUnlocked(true);
    localStorage.setItem("batsax-credits-unlocked", "true"); 
  }

    if (score > 0 && !autoPlayAttempted.current) {
    autoPlayAttempted.current = true;
    play(); 
  }

  if (score >= 600 && !bossMusicPlayed.current) {
    bossMusicPlayed.current = true; 
    
    playRandomTrack([
      { title: "MEGALOVANIA", url: "/music/MEGALOVANIA.ogg" }
    ]);
  }
};

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[85vh] md:min-h-[70vh]">
      
      <MiniGame onScoreUpdate={handleScoreUpdate} />

      <div className="text-center flex flex-col items-center gap-8 z-10 p-6 bg-black/40 rounded-3xl backdrop-blur-sm border border-gray-900 transition-all duration-500">
        <h1 className="text-4xl neon">BatSax</h1>

        <p className="text-sm opacity-70 max-w-md">
          Trio de saxophones + batterie dédié aux musiques de jeux vidéo.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Link to="/next" className="btn btn-primary">
            Next Stages
          </Link>
          <Link to="/saves" className="btn btn-outline">
            Stages Completed
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