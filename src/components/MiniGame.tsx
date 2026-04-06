import { useEffect, useState, useRef } from "react";

// --- DÉFINITIONS ---
type TrackId = "left" | "up" | "down" | "right";

const TRACKS = [
  { id: "left" as TrackId, symbol: "⬅️", keys: ["arrowleft", "q", "a"] },
  { id: "up" as TrackId, symbol: "⬆️", keys: ["arrowup", "z", "w"] },
  { id: "down" as TrackId, symbol: "⬇️", keys: ["arrowdown", "s"] },
  { id: "right" as TrackId, symbol: "➡️", keys: ["arrowright", "d"] },
];

type Arrow = { id: string; startTime: number; status: "active" | "missed"; track: TrackId; };

// NOUVEAU : On ajoute une prop pour envoyer le score au parent (Lobby)
type Props = {
  onScoreUpdate?: (score: number) => void;
};

export default function MiniGame({ onScoreUpdate }: Props) {
  const [scoreState, setScoreState] = useState(0);
  const scoreRef = useRef(0);
  
  const [comboState, setComboState] = useState(0);
  const comboRef = useRef(0);

  // NOUVEAU : On prévient le parent à chaque changement de score
  const setScore = (updater: (prev: number) => number) => {
    scoreRef.current = Math.max(0, updater(scoreRef.current));
    setScoreState(scoreRef.current);
    if (onScoreUpdate) onScoreUpdate(scoreRef.current); 
  };
  
  const setCombo = (val: number | ((prev: number) => number)) => {
    comboRef.current = typeof val === "function" ? val(comboRef.current) : val;
    setComboState(comboRef.current);
  };

  const initTracksState = <T,>(val: T) => ({ left: val, up: val, down: val, right: val } as Record<TrackId, T>);
  const [feedbacks, setFeedbacks] = useState(initTracksState<"success" | "fail" | null>(null));
  const [arrows, setArrowsState] = useState<Arrow[]>([]);
  
  const arrowsRef = useRef<Arrow[]>([]);
  const lastMissTime = useRef(initTracksState<number>(0));
  const feedbackTimers = useRef(initTracksState<number | null>(null));

  const FALL_DURATION = 3000;
  const IDEAL_TIME = FALL_DURATION * (90 / 110); 
  const MARGIN = 200; 

  const updateArrows = (updater: Arrow[] | ((prev: Arrow[]) => Arrow[])) => {
    arrowsRef.current = typeof updater === "function" ? updater(arrowsRef.current) : updater;
    setArrowsState(arrowsRef.current);
  };

  const triggerFeedback = (track: TrackId, type: "success" | "fail") => {
    setFeedbacks(prev => ({ ...prev, [track]: type }));
    if (feedbackTimers.current[track]) window.clearTimeout(feedbackTimers.current[track]!);
    feedbackTimers.current[track] = window.setTimeout(() => {
      setFeedbacks(prev => ({ ...prev, [track]: null }));
    }, 150);
  };

  // --- DIFFICULTÉ ---
  const getDifficulty = (currentScore: number) => {
    if (currentScore < 100) return { tracks: ["down"] as TrackId[], minTicks: 4, maxTicks: 6, doubleChance: 0 };
    if (currentScore < 300) return { tracks: ["left", "right"] as TrackId[], minTicks: 3, maxTicks: 5, doubleChance: 0 };
    if (currentScore < 600) return { tracks: ["left", "right"] as TrackId[], minTicks: 2, maxTicks: 4, doubleChance: 0.1 };
    if (currentScore < 1200) return { tracks: ["left", "up", "down", "right"] as TrackId[], minTicks: 2, maxTicks: 3, doubleChance: 0.2 };
    return { tracks: ["left", "up", "down", "right"] as TrackId[], minTicks: 1, maxTicks: 2, doubleChance: 0.3 };
  };

  useEffect(() => {
    let timeoutId: number;
    const spawnArrow = () => {
      const diff = getDifficulty(scoreRef.current);
      const numArrows = Math.random() < diff.doubleChance ? 2 : 1;
      const shuffledTracks = [...diff.tracks].sort(() => 0.5 - Math.random());
      const selectedTracks = shuffledTracks.slice(0, numArrows);

      const now = Date.now();
      const newArrows: Arrow[] = selectedTracks.map(track => ({
        id: `${now}-${track}`, startTime: now, status: "active", track
      }));
      
      updateArrows(prev => [...prev, ...newArrows]);

      window.setTimeout(() => {
        updateArrows(prev => {
          let missedAny = false;
          const remaining = prev.filter(a => {
            if (newArrows.some(na => na.id === a.id) && a.status === "active") {
              missedAny = true;
              triggerFeedback(a.track, "fail");
              return false; 
            }
            return newArrows.every(na => na.id !== a.id); 
          });

          if (missedAny) {
            setScore(s => s - 5);
            setCombo(0); 
          }
          return remaining;
        });
      }, FALL_DURATION + 100);

      const ticksRange = diff.maxTicks - diff.minTicks + 1;
      const ticks = Math.floor(Math.random() * ticksRange) + diff.minTicks;
      timeoutId = window.setTimeout(spawnArrow, ticks * 250);
    };

    timeoutId = window.setTimeout(spawnArrow, 2000); 
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const trackObj = TRACKS.find(t => t.keys.includes(key));
      if (!trackObj) return; 
      const track = trackObj.id;

      const currentArrows = arrowsRef.current;
      const activeIndex = currentArrows.findIndex(a => a.status === "active" && a.track === track);
      if (activeIndex === -1) return;

      const targetArrow = currentArrows[activeIndex];
      const timeElapsed = Date.now() - targetArrow.startTime;

      if (Math.abs(timeElapsed - IDEAL_TIME) < MARGIN) {
        setCombo(c => c + 1);
        const multiplier = comboRef.current >= 50 ? 4 : (comboRef.current >= 10 ? 2 : 1);
        setScore(s => s + (10 * multiplier));
        triggerFeedback(track, "success");
        updateArrows(prev => prev.filter(a => a.id !== targetArrow.id));
      } else {
        const now = Date.now();
        if (now - lastMissTime.current[track] < 400) return;
        lastMissTime.current[track] = now;
        triggerFeedback(track, "fail");
        setScore(s => s - 5);
        setCombo(0); 
        updateArrows(prev => {
          const newArrows = [...prev];
          const idx = newArrows.findIndex(a => a.id === targetArrow.id);
          if (idx !== -1) newArrows[idx] = { ...targetArrow, status: "missed" };
          return newArrows;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const multiplier = comboState >= 50 ? 4 : (comboState >= 10 ? 2 : 1);
  
  // NOUVEAU : On récupère quelles pistes sont actives à l'instant T
  const currentActiveTracks = getDifficulty(scoreState).tracks;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col items-center z-0 opacity-80">
      
      <div className="absolute top-10 flex flex-col items-center gap-1">
        <span className="text-xs font-['Press_Start_2P'] tracking-widest text-primary opacity-80">SCORE</span>
        <span className="text-4xl neon text-white">{scoreState.toString().padStart(5, "0")}</span>
        
        {comboState > 2 && (
          <div className="flex items-center gap-4 mt-2 animate-pulse">
            <span className="text-sm font-['Press_Start_2P'] text-yellow-400">{comboState} COMBO</span>
            {multiplier > 1 && (
              <span className={`text-sm font-['Press_Start_2P'] ${multiplier >= 4 ? 'text-red-500 neon' : 'text-orange-400'}`}>
                x{multiplier}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center h-full mt-32 border border-gray-800 rounded-t-xl overflow-hidden divide-x divide-gray-800 bg-black/20 transition-all duration-500">
        
        {/* NOUVEAU : On filtre pour ne rendre QUE les pistes actives dans la difficulté actuelle */}
        {TRACKS.filter(track => currentActiveTracks.includes(track.id)).map((track) => (
          <div key={track.id} className="relative w-20 h-full">
            <div 
              className={`absolute w-full h-16 top-[80%] border-y-4 flex items-center justify-center transition-colors duration-100 ${
                feedbacks[track.id] === "success" ? "border-green-500 bg-green-500/30 shadow-[0_0_20px_#22c55e]" : 
                feedbacks[track.id] === "fail" ? "border-red-500 bg-red-500/30" : "border-primary/50"
              }`}
            >
              <span className="text-2xl grayscale opacity-30">{track.symbol}</span>
            </div>

            {arrows.filter(a => a.track === track.id).map(arrow => (
              <div 
                key={arrow.id}
                className={`absolute w-full flex flex-col items-center justify-center animate-fall transition-all duration-200 ${
                  arrow.status === "missed" ? "grayscale opacity-20 scale-90" : ""
                }`}
              >
                <span className={`text-3xl ${arrow.status === "active" ? "neon text-primary drop-shadow-[0_0_10px_#00ffcc]" : ""}`}>
                  {track.symbol}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}