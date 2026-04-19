import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  useCallback
} from 'react';

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
  pause: (fadeDuration?: number) => void;
  changeVolume: (vol: number) => void;
  playRandomTrack: (tracks: Track[], forcePlay?: boolean) => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const isPlayingRef = useRef(false);
  const volumeRef = useRef(0.3);
  const currentTrackRef = useRef<Track | null>(null);

  const currentTrackListRef = useRef<Track[]>([]);
  const currentFadeCallback = useRef<(() => void) | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimer = useRef<number | null>(null);
  const handleEndedRef = useRef<(() => void) | null>(null);

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

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volumeRef.current;
      audioRef.current.loop = false;

      audioRef.current.addEventListener('ended', () => {
        if (handleEndedRef.current) handleEndedRef.current();
      });

      audioRef.current.addEventListener('play', () => updateIsPlaying(true));
      audioRef.current.addEventListener('pause', () => updateIsPlaying(false));
    }
    return audioRef.current;
  }, [updateIsPlaying]); // N'oubliez pas d'ajouter updateIsPlaying dans le tableau de dépendances

  useEffect(() => {
    return () => {
      if (fadeTimer.current) window.clearInterval(fadeTimer.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const fadeAudio = useCallback(
    (targetVol: number, duration: number, callback?: () => void) => {
      const audio = getAudio();

      // SÉCURITÉ : Annuler tout fondu précédent et vider son callback
      if (fadeTimer.current) {
        window.clearInterval(fadeTimer.current);
        currentFadeCallback.current = null;
      }

      // Stocker le nouveau callback
      currentFadeCallback.current = callback || null;

      const startVol = audio.volume;
      const distance = targetVol - startVol;
      const steps = 20;
      const stepTime = duration / steps;
      const volumeStep = distance / steps;

      let currentStep = 0;

      fadeTimer.current = window.setInterval(() => {
        currentStep++;
        let newVol = startVol + volumeStep * currentStep;

        if (newVol < 0) newVol = 0;
        if (newVol > 1) newVol = 1;

        audio.volume = newVol;

        if (currentStep >= steps) {
          if (fadeTimer.current) window.clearInterval(fadeTimer.current);
          audio.volume = targetVol;

          // Exécuter le callback uniquement si ce fondu n'a pas été interrompu
          if (currentFadeCallback.current) {
            currentFadeCallback.current();
            currentFadeCallback.current = null;
          }
        }
      }, stepTime);
    },
    [getAudio]
  );

  const pause = useCallback(
    (fadeDuration = 300) => {
      if (!isPlayingRef.current) return;
      const audio = getAudio();

      if (fadeTimer.current) window.clearInterval(fadeTimer.current);

      if (fadeDuration <= 0) {
        audio.pause();
        updateIsPlaying(false);
        audio.volume = volumeRef.current;
      } else {
        // Coupe en douceur (pour l'inactivité)
        fadeAudio(0, fadeDuration, () => {
          audio.pause();
          updateIsPlaying(false);
          audio.volume = volumeRef.current;
        });
      }
    },
    [fadeAudio, getAudio, updateIsPlaying]
  );

  const play = useCallback(() => {
    if (!currentTrackRef.current || isPlayingRef.current) return;

    const audio = getAudio();
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        updateIsPlaying(true);
        fadeAudio(volumeRef.current, 300);
      })
      .catch((e) => {
        console.error('Erreur de lecture :', e);
        updateIsPlaying(false);
      });
  }, [fadeAudio, getAudio, updateIsPlaying]);

  const togglePlay = useCallback(() => {
    if (!currentTrackRef.current) return;
    if (isPlayingRef.current) {
      pause(300); // On réutilise notre nouvelle fonction !
    } else {
      play();
    }
  }, [pause, play, currentTrackRef]);

  const changeVolume = useCallback(
    (vol: number) => {
      updateVolume(vol);
      if (fadeTimer.current) window.clearInterval(fadeTimer.current);
      getAudio().volume = vol;
    },
    [getAudio, updateVolume]
  );

  const playRandomTrack = useCallback(
    (tracks: Track[], forcePlay = false) => {
      if (!tracks.length) return;

      currentTrackListRef.current = tracks;
      const audio = getAudio();

      const availableTracks = tracks.filter(
        (t) => t.url !== currentTrackRef.current?.url
      );
      const pool = availableTracks.length > 0 ? availableTracks : tracks;
      const randomTrack = pool[Math.floor(Math.random() * pool.length)];

      const hasSource = audio.src && audio.src.includes(randomTrack.url);
      if (currentTrackRef.current?.url === randomTrack.url && hasSource) return;

      // CORRECTION : On vérifie si la musique jouait AVANT de changer de page
      const wasPlaying = isPlayingRef.current || forcePlay;

      updateCurrentTrack(randomTrack);
      audio.src = randomTrack.url;

      // Si le lecteur était en pause (ou n'a jamais démarré), on ne lance PAS le son.
      // La piste est chargée et prête, c'est tout.
      if (!wasPlaying) {
        return;
      }

      // Si le lecteur était sur "Play", on lance la nouvelle musique avec le fondu
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          updateIsPlaying(true);
          fadeAudio(volumeRef.current, 1000);
        })
        .catch((e) => {
          console.warn('Autoplay bloqué par le navigateur', e);
          updateIsPlaying(false);
          audio.volume = volumeRef.current;
        });
    },
    [fadeAudio, getAudio, updateCurrentTrack, updateIsPlaying]
  );

  handleEndedRef.current = () => {
    const tracks = currentTrackListRef.current;

    if (tracks.length > 1) {
      // On force la lecture de la piste suivante avec "true"
      playRandomTrack(tracks, true);
    } else {
      const audio = getAudio();
      audio.currentTime = 0;
      audio.play().catch((e) => console.error('Erreur de loop manuel :', e));
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        volume,
        currentTrack,
        togglePlay,
        play,
        pause,
        changeVolume,
        playRandomTrack
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context)
    throw new Error('useAudio doit être utilisé dans un AudioProvider');
  return context;
}
