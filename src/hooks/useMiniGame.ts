import { useEffect, useState, useRef } from "react";

export type TrackId = "left" | "up" | "down" | "right";

export const TRACKS = [
  { id: "left" as TrackId, symbol: "⬅️", keys: ["arrowleft", "q", "a"] },
  { id: "up" as TrackId, symbol: "⬆️", keys: ["arrowup", "z", "w"] },
  { id: "down" as TrackId, symbol: "⬇️", keys: ["arrowdown", "s"] },
  { id: "right" as TrackId, symbol: "➡️", keys: ["arrowright", "d"] },
];

export type Arrow = { id: string; startTime: number; status: "active" | "missed"; track: TrackId; };

// ============================================================================
// --- PARAMÈTRES DU JEU (Modifiez ces valeurs pour équilibrer le gameplay) ---
// ============================================================================

// Temps
const FALL_DURATION = 3000; // Temps de chute complet d'une flèche du haut vers le bas de l'écran
const IDEAL_TIME = FALL_DURATION * (90 / 110); // Le moment parfait pour cliquer (ici à 81% de la chute)
const MARGIN = 200; // Fenêtre de temps (en ms) pour faire un "Perfect"
const MISS_MARGIN = 500; // Fenêtre (en ms) où le clic compte comme "Raté" (trop tôt ou trop tard)
const AUTO_FAIL_MS = IDEAL_TIME + MARGIN + 50;
const SPAM_PREVENTION_MS = 400; // Temps de "cooldown" (en ms) avant de pouvoir recliquer sur la même piste si on a raté
const SPAWN_TICK_MS = 250; // Unité de temps rythmique (1 tick = 250ms). Les flèches apparaissent tous les X ticks.
const INITIAL_SPAWN_DELAY = 2000; // Temps d'attente (en ms) avant de lancer la toute première flèche
const FEEDBACK_DURATION = 150; // Durée du clignotement (vert ou rouge) de la zone de clic

// Scores
export const CREDITS_UNLOCK_SCORE = 1200; 
const BASE_HIT_SCORE = 10; // Points gagnés par note réussie (avant multiplicateur)
const PENALTY_SCORE = 5; // Points perdus en cas d'erreur (mauvais timing ou flèche ignorée)

// Note : Toujours trier du plus grand au plus petit pour la fonction de recherche !
export const COMBO_MULTIPLIERS = [
  { threshold: 40, value: 4 },
  { threshold: 20, value: 3 },
  { threshold: 10, value: 2 },
  { threshold: 0, value: 1 } 
];

export const getComboMultiplier = (currentCombo: number) => {
  const match = COMBO_MULTIPLIERS.find(m => currentCombo >= m.threshold);
  return match ? match.value : 1;
};

export const GAME_MILESTONES = [
  { score: 100, name: "ADAGIO", difficulty: { tracks: ["down"] as TrackId[], minTicks: 4, maxTicks: 6, doubleChance: 0 } },
  { score: 300, name: "MODERATO", difficulty: { tracks: ["up", "down"] as TrackId[], minTicks: 3, maxTicks: 5, doubleChance: 0 } },
  { score: 600, name: "ALLEGRO", difficulty: { tracks: ["up", "down"] as TrackId[], minTicks: 2, maxTicks: 4, doubleChance: 0.1 } },
  { score: CREDITS_UNLOCK_SCORE, name: "PRESTO (CRÉDITS)", difficulty: { tracks: ["left", "up", "down", "right"] as TrackId[], minTicks: 2, maxTicks: 3, doubleChance: 0.2 } },
  { score: Infinity, name: "VIRTUOSO", difficulty: { tracks: ["left", "up", "down", "right"] as TrackId[], minTicks: 1, maxTicks: 2, doubleChance: 0.3 } }
];
// ------------------------------------------------------------------

export function useMiniGame(onScoreUpdate?: (score: number) => void) {
  const [bestScoreState, setBestScoreState] = useState(() => {
    const saved = localStorage.getItem("batsax-best-score");
    return saved ? parseInt(saved, 10) : 0;
  });
  const bestScoreRef = useRef(bestScoreState);

  const [scoreState, setScoreState] = useState(0);
  const scoreRef = useRef(0);
  
  const [comboState, setComboState] = useState(0);
  const comboRef = useRef(0);

  const initTracksState = <T,>(val: T) => ({ left: val, up: val, down: val, right: val } as Record<TrackId, T>);
  const [feedbacks, setFeedbacks] = useState(initTracksState<"success" | "fail" | null>(null));
  const [arrows, setArrowsState] = useState<Arrow[]>([]);
  
  const arrowsRef = useRef<Arrow[]>([]);
  const lastMissTime = useRef(initTracksState<number>(0));
  const feedbackTimers = useRef(initTracksState<number | null>(null));

  const setScore = (updater: (prev: number) => number) => {
    scoreRef.current = Math.max(0, updater(scoreRef.current));
    setScoreState(scoreRef.current);
    if (onScoreUpdate) onScoreUpdate(scoreRef.current); 

    if (scoreRef.current > bestScoreRef.current) {
      bestScoreRef.current = scoreRef.current;
      setBestScoreState(scoreRef.current);
      localStorage.setItem("batsax-best-score", scoreRef.current.toString());
    }
  };
  
  const setCombo = (val: number | ((prev: number) => number)) => {
    comboRef.current = typeof val === "function" ? val(comboRef.current) : val;
    setComboState(comboRef.current);
  };

  const updateArrows = (updater: Arrow[] | ((prev: Arrow[]) => Arrow[])) => {
    arrowsRef.current = typeof updater === "function" ? updater(arrowsRef.current) : updater;
    setArrowsState(arrowsRef.current);
  };

  const triggerFeedback = (track: TrackId, type: "success" | "fail") => {
    setFeedbacks(prev => ({ ...prev, [track]: type }));
    if (feedbackTimers.current[track]) window.clearTimeout(feedbackTimers.current[track]!);
    feedbackTimers.current[track] = window.setTimeout(() => setFeedbacks(prev => ({ ...prev, [track]: null })), FEEDBACK_DURATION);
  };

  const getDifficulty = (currentScore: number) => {
    const milestone = GAME_MILESTONES.find(m => currentScore < m.score) || GAME_MILESTONES[GAME_MILESTONES.length - 1];
    return milestone.difficulty;
  };

  const handleTrackHit = (track: TrackId) => {
    const currentArrows = arrowsRef.current;
    const activeIndex = currentArrows.findIndex(a => a.status === "active" && a.track === track);
    
    if (activeIndex === -1) {
      const now = Date.now();
      if (now - lastMissTime.current[track] < SPAM_PREVENTION_MS) return;
      lastMissTime.current[track] = now;
      triggerFeedback(track, "fail");
      setScore(s => s - PENALTY_SCORE);
      setCombo(0);
      return;
    }

    const targetArrow = currentArrows[activeIndex];
    const timeElapsed = Date.now() - targetArrow.startTime;

    if (Math.abs(timeElapsed - IDEAL_TIME) < MARGIN) {
      setCombo(c => c + 1);
      
      const multiplier = getComboMultiplier(comboRef.current);
      
      setScore(s => s + (BASE_HIT_SCORE * multiplier));
      triggerFeedback(track, "success");
      updateArrows(prev => prev.filter(a => a.id !== targetArrow.id));
    } else {
      const now = Date.now();
      if (now - lastMissTime.current[track] < SPAM_PREVENTION_MS) return;

      lastMissTime.current[track] = now;
      triggerFeedback(track, "fail");
      setScore(s => s - PENALTY_SCORE);
      setCombo(0); 

      if (Math.abs(timeElapsed - IDEAL_TIME) < MISS_MARGIN) {
        updateArrows(prev => {
          const newArrows = [...prev];
          const idx = newArrows.findIndex(a => a.id === targetArrow.id);
          if (idx !== -1) newArrows[idx] = { ...targetArrow, status: "missed" };
          return newArrows;
        });
      }
    }
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

      // Se déclenche juste après que la flèche ait quitté la zone de clic.
      window.setTimeout(() => {
        updateArrows(prev => {
          let missedAny = false;
          const updated = prev.map(a => {
            // Si c'est notre flèche et qu'elle est toujours "active" (non cliquée)
            if (newArrows.some(na => na.id === a.id) && a.status === "active") {
              missedAny = true;
              triggerFeedback(a.track, "fail"); // Flash rouge !
              return { ...a, status: "missed" } as Arrow; // La flèche devient grise et non-cliquable
            }
            return a;
          });

          if (missedAny) {
            setScore(s => s - PENALTY_SCORE);
            setCombo(0); 
          }
          return updated;
        });
      }, AUTO_FAIL_MS);

      // Se déclenche uniquement quand la flèche a fini de traverser tout l'écran
      window.setTimeout(() => {
        updateArrows(prev => prev.filter(a => !newArrows.some(na => na.id === a.id)));
      }, FALL_DURATION + 100);

      const ticksRange = diff.maxTicks - diff.minTicks + 1;
      const ticks = Math.floor(Math.random() * ticksRange) + diff.minTicks;
      timeoutId = window.setTimeout(spawnArrow, ticks * SPAWN_TICK_MS);
    };

    timeoutId = window.setTimeout(spawnArrow, INITIAL_SPAWN_DELAY); 
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const trackObj = TRACKS.find(t => t.keys.includes(key));
      if (!trackObj) return; 
      
      handleTrackHit(trackObj.id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return {
    scoreState,
    bestScoreState, 
    comboState,
    arrows,
    feedbacks,
    currentActiveTracks: getDifficulty(scoreState).tracks,
    handleTrackHit
  };
}