import { Link } from "react-router-dom";
import { useMiniGame, TRACKS, GAME_MILESTONES, getComboMultiplier, CREDITS_UNLOCK_SCORE } from "../hooks/useMiniGame"; // NOUVEAU : Import de la fonction

type Props = {
  onScoreUpdate?: (score: number) => void;
};

export default function MiniGame({ onScoreUpdate }: Props) {
  const { scoreState, bestScoreState, comboState, arrows, feedbacks, currentActiveTracks, handleTrackHit } = useMiniGame(onScoreUpdate);

  const multiplier = getComboMultiplier(comboState);
  
  const nextMilestone = GAME_MILESTONES.find(m => scoreState < m.score) || GAME_MILESTONES[GAME_MILESTONES.length - 1];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col items-center z-0 opacity-80">
      
      <div className="absolute top-4 w-full max-w-4xl px-4 md:px-8 flex justify-between items-start">
        
        <div className="flex flex-col items-start gap-1">
          <span className="text-[8px] md:text-[10px] font-['Press_Start_2P'] text-primary opacity-80">
            Objectif : {nextMilestone.name}
          </span>
          <span className="text-xs md:text-sm font-['Press_Start_2P'] text-white/80">
            {nextMilestone.score === Infinity ? "MAX" : nextMilestone.score.toString().padStart(5, "0")}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[8px] md:text-[10px] font-['Press_Start_2P'] text-yellow-400 opacity-80">HI-SCORE</span>
          <span className="text-xs md:text-sm font-['Press_Start_2P'] text-yellow-400 neon">
            {bestScoreState.toString().padStart(5, "0")}
          </span>
        </div>
        
      </div>

      <div className="absolute top-14 md:top-16 flex flex-col items-center gap-1">
        <span className="text-xs font-['Press_Start_2P'] tracking-widest text-primary opacity-80">SCORE</span>
        <span className="text-4xl neon text-white">{scoreState.toString().padStart(5, "0")}</span>
        <div className="min-h-[1.75rem]">
          {scoreState >= CREDITS_UNLOCK_SCORE ? (
            <Link
              to="/credits"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-yellow-500 bg-black/60 px-2 py-1 text-[10px] uppercase tracking-widest font-['Press_Start_2P'] text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all hover:bg-yellow-500 hover:text-black animate-bounce"
            >
              <span className="text-lg">⭐</span>
              CREDITS
            </Link>
          ) : null}
        </div>

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
        
        {TRACKS.filter(track => currentActiveTracks.includes(track.id)).map((track) => (
          <div 
            key={track.id} 
            className="relative w-20 h-full pointer-events-auto cursor-pointer touch-manipulation select-none active:bg-white/5 transition-colors"
            onPointerDown={(e) => {
              e.preventDefault(); 
              handleTrackHit(track.id);
            }}
          >
            
            <div 
              className={`absolute w-full h-16 top-[80%] border-y-4 flex items-center justify-center transition-colors duration-100 cursor-none ${
                feedbacks[track.id] === "success" ? "border-green-500 bg-green-500/30 shadow-[0_0_20px_#22c55e]" : 
                feedbacks[track.id] === "fail" ? "border-red-500 bg-red-500/30" : "border-primary/50"
              }`}
            >
              <span className="text-2xl grayscale opacity-30 pointer-events-none">{track.symbol}</span>
            </div>

            {arrows.filter(a => a.track === track.id).map(arrow => (
              <div 
                key={arrow.id}
                className={`absolute w-full flex flex-col items-center justify-center animate-fall transition-all duration-200 pointer-events-none ${
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