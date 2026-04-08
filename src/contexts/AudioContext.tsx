import { createContext, useContext, useEffect, useRef, useState, type ReactNode, useCallback } from "react";

export type Track = {
  title: string;
  url: string;
};

type AudioContextType = {
  isPlaying: boolean;
  volume: number;
  currentTrack: Track | null;
  togglePlay: () => void;
  play: () => void; 
  changeVolume: (vol: number) => void;
  playRandomTrack: (tracks: Track[]) => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); 
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const isPlayingRef = useRef(false);
  const volumeRef = useRef(0.3);
  const currentTrackRef = useRef<Track | null>(null);
  
  // --- NOUVEAU : On mémorise la liste de lecture actuelle ---
  const currentTrackListRef = useRef<Track[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimer = useRef<number | null>(null); 

  const updateIsPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    isPlayingRef.current = playing;
  }, []);

  const updateVolume = useCallback((vol: number) => {
    setVolume(vol);
    volumeRef.current = vol;
  }, []);

  const updateCurrentTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    currentTrackRef.current = track;
  }, []);

  // --- NOUVEAU : Une "Ref" magique pour toujours avoir la dernière version de notre fonction de fin de piste ---
  const handleEndedRef = useRef<(() => void) | null>(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volumeRef.current;
      
      // MODIFIÉ : On désactive le loop infini automatique du navigateur
      audioRef.current.loop = false;

      // NOUVEAU : On branche notre écouteur de fin de piste
      audioRef.current.addEventListener('ended', () => {
        if (handleEndedRef.current) handleEndedRef.current();
      });
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimer.current) window.clearInterval(fadeTimer.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const fadeAudio = useCallback((targetVol: number, duration: number, callback?: () => void) => {
    const audio = getAudio();
    if (fadeTimer.current) window.clearInterval(fadeTimer.current);

    const startVol = audio.volume;
    const distance = targetVol - startVol;
    const steps = 20; 
    const stepTime = duration / steps;
    const volumeStep = distance / steps;

    let currentStep = 0;

    fadeTimer.current = window.setInterval(() => {
      currentStep++;
      let newVol = startVol + (volumeStep * currentStep);
      
      if (newVol < 0) newVol = 0;
      if (newVol > 1) newVol = 1;

      audio.volume = newVol;

      if (currentStep >= steps) {
        if (fadeTimer.current) window.clearInterval(fadeTimer.current);
        audio.volume = targetVol;
        if (callback) callback(); 
      }
    }, stepTime);
  }, [getAudio]);

  const play = useCallback(() => {
    if (!currentTrackRef.current || isPlayingRef.current) return;
    
    const audio = getAudio();
    audio.volume = 0;
    audio.play()
      .then(() => {
        updateIsPlaying(true);
        fadeAudio(volumeRef.current, 300);
      })
      .catch(e => console.error("Erreur de lecture :", e));
  }, [fadeAudio, getAudio, updateIsPlaying]);

  const togglePlay = useCallback(() => {
    if (!currentTrackRef.current) return;
    const audio = getAudio();
    
    if (isPlayingRef.current) {
      fadeAudio(0, 300, () => {
        audio.pause();
        updateIsPlaying(false);
        audio.volume = volumeRef.current; 
      });
    } else {
      play();
    }
  }, [fadeAudio, getAudio, play, updateIsPlaying]);

  const changeVolume = useCallback((vol: number) => {
    updateVolume(vol);
    if (fadeTimer.current) window.clearInterval(fadeTimer.current);
    getAudio().volume = vol; 
  }, [getAudio, updateVolume]);

  const playRandomTrack = useCallback((tracks: Track[]) => {
    if (!tracks.length) return;
    
    // NOUVEAU : On enregistre la playlist en cours
    currentTrackListRef.current = tracks;
    
    const audio = getAudio();
    
    const availableTracks = tracks.filter(t => t.url !== currentTrackRef.current?.url);
    const pool = availableTracks.length > 0 ? availableTracks : tracks;
    const randomTrack = pool[Math.floor(Math.random() * pool.length)];

    const hasSource = audio.src && audio.src.includes(randomTrack.url);
    if (currentTrackRef.current?.url === randomTrack.url && hasSource) return;

    if (!isPlayingRef.current) {
      updateCurrentTrack(randomTrack);
      audio.src = randomTrack.url;
      return;
    }

    fadeAudio(0, 1000, () => {
      updateCurrentTrack(randomTrack);
      audio.src = randomTrack.url;
      
      audio.play().then(() => {
        fadeAudio(volumeRef.current, 1000);
      }).catch(e => {
        console.warn("Autoplay bloqué par le navigateur", e);
        updateIsPlaying(false);
        audio.volume = volumeRef.current;
      });
    });
  }, [fadeAudio, getAudio, updateCurrentTrack, updateIsPlaying]);

    handleEndedRef.current = () => {
    const tracks = currentTrackListRef.current;
    
    if (tracks.length > 1) {
      // S'il y a d'autres pistes, on relance la moulinette de l'aléatoire.
      // bonus : cela va créer une petite seconde de silence très pro entre les pistes
      // grâce à notre fondu !
      playRandomTrack(tracks);
    } else {
      // S'il n'y a qu'une piste dans le tableau (ex: le boss), on la relance manuellement !
      const audio = getAudio();
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Erreur de loop manuel :", e));
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, volume, currentTrack, togglePlay, play, changeVolume, playRandomTrack }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio doit être utilisé dans un AudioProvider");
  return context;
}