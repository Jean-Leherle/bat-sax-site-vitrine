import { useEffect, useState, useRef } from "react";

export type TrackId = "left" | "up" | "down" | "right";

export const TRACKS = [
  { id: "left" as TrackId, symbol: "⬅️", keys: ["arrowleft", "q", "a"] },
  { id: "up" as TrackId, symbol: "⬆️", keys: ["arrowup", "z", "w"] },
  { id: "down" as TrackId, symbol: "⬇️", keys: ["arrowdown", "s"] },
  { id: "right" as TrackId, symbol: "➡️", keys: ["arrowright", "d"] },
];

export type Arrow = { id: string; startTime: number; status: "active" | "missed"; track: TrackId; };

const FALL_DURATION = 3000;
const IDEAL_TIME = FALL_DURATION * (90 / 110); 
const MARGIN = 200; 
const MISS_MARGIN = 500;

export const CREDITS_UNLOCK_SCORE = 1200; // La valeur officielle pour débloquer les crédits

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
    feedbackTimers.current[track] = window.setTimeout(() => setFeedbacks(prev => ({ ...prev, [track]: null })), 150);
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
      if (now - lastMissTime.current[track] < 400) return;
      lastMissTime.current[track] = now;
      triggerFeedback(track, "fail");
      setScore(s => s - 5);
      setCombo(0);
      return;
    }

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