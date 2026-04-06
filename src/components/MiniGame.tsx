import { useMiniGame, TRACKS } from "../hooks/useMiniGame";

type Props = {
  onScoreUpdate?: (score: number) => void;
};

export default function MiniGame({ onScoreUpdate }: Props) {
  // On récupère handleTrackHit
  const { scoreState, comboState, arrows, feedbacks, currentActiveTracks, handleTrackHit } = useMiniGame(onScoreUpdate);

  const multiplier = comboState >= 50 ? 4 : (comboState >= 10 ? 2 : 1);

  return (
    // La div parente a pointer-events-none pour ne pas bloquer tout l'écran
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col items-center z-0 opacity-80">
      
      {/* UI SCORE & COMBO */}
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
        
        {TRACKS.filter(track => currentActiveTracks.includes(track.id)).map((track) => (
          <div 
            key={track.id} 
            // NOUVEAU : On rend cette colonne cliquable (pointer-events-auto) et optimisée pour le tactile
            className="relative w-20 h-full pointer-events-auto cursor-pointer touch-manipulation select-none active:bg-white/5 transition-colors"
            onPointerDown={(e) => {
              e.preventDefault(); // Empêche les comportements natifs du navigateur
              handleTrackHit(track.id);
            }}
          >
            
            {/* Zone de validation */}
            <div 
              className={`absolute w-full h-16 top-[80%] border-y-4 flex items-center justify-center transition-colors duration-100 ${
                feedbacks[track.id] === "success" ? "border-green-500 bg-green-500/30 shadow-[0_0_20px_#22c55e]" : 
                feedbacks[track.id] === "fail" ? "border-red-500 bg-red-500/30" : "border-primary/50"
              }`}
            >
              <span className="text-2xl grayscale opacity-30 pointer-events-none">{track.symbol}</span>
            </div>

            {/* Rendu des Flèches */}
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