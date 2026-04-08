import { useAudio } from "../contexts/AudioContext";

export default function AudioPlayer() {
  const { isPlaying, volume, currentTrack, togglePlay, changeVolume } = useAudio();

  if (!currentTrack) return null;

  return (
    <div className="flex items-center gap-3 bg-black/40 border border-gray-800 px-3 py-1.5 rounded-full backdrop-blur-md">
      
      <button 
        onClick={togglePlay} 
        className="text-primary hover:scale-110 hover:text-white transition-all cursor-none w-6 flex justify-center"
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <div className="hidden md:block w-32 overflow-hidden">
        <p className="text-[8px] font-['Press_Start_2P'] text-white opacity-80 truncate" title={currentTrack.title}>
          {currentTrack.title}
        </p>
      </div>

      <div className="flex items-center gap-1 group">
        <span className="text-[10px] grayscale opacity-70">🔊</span>
        <input 
          type="range" 
          min="0" max="1" step="0.05" 
          value={volume} 
          onChange={(e) => changeVolume(parseFloat(e.target.value))}
          className="range range-xs range-primary w-16 md:w-20 cursor-none" 
        />
      </div>

    </div>
  );
}