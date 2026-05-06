import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAudio } from "../contexts/AudioContext"; 
import type { Concert } from "./Stages";

type SetlistTrack = {
  is_secret: boolean;
  track_id: number;
  tracks: { title: string; game: string; };
};

const getYoutubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

const FALLBACK_IMAGE = "https://placehold.co/600x400/1a1a1a/ff0000?text=Image+Indisponible";

export default function ConcertDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pause } = useAudio(); 

  const [concert, setConcert] = useState<Concert | null>(null);
  const [setlist, setSetlist] = useState<SetlistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [playingVideos, setPlayingVideos] = useState<number[]>([]); 
  
  // NOUVEAU : Liste noire des vidéos cassées
  const [failedVideos, setFailedVideos] = useState<number[]>([]);

  useEffect(() => {
    const fetchConcertData = async () => {
      if (!id) return;
      const { data: concertData } = await supabase.from("concerts").select("*").eq("id", id).single();
      if (concertData) setConcert(concertData as Concert);

      const { data: setlistData } = await supabase.from("concert_tracks").select("*, tracks(*)").eq("concert_id", id).order("play_order", { ascending: true });
      if (setlistData) setSetlist(setlistData as SetlistTrack[]);
      setLoading(false);
    };
    fetchConcertData();
  }, [id]);

  if (loading) return <div className="text-center neon mt-12">Loading Level Data...</div>;
  if (!concert) return <div className="text-center mt-12 text-red-500">Concert introuvable.</div>;

  const dateStr = concert.date;
  const datePart = dateStr.split(/[\sT]/)[0];
  const timePart = (dateStr.includes('T') || dateStr.includes(' ')) ? dateStr.split(/[\sT]/)[1].slice(0, 5) : "00:00";
  const hasTime = timePart !== "00:00";

  const dateObj = new Date(datePart);
  const formattedDate = dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) + (hasTime ? ` à ${timePart.replace(':', 'h')}` : '');

  const mapsLink = concert.locationLink || `https://maps.google.com/?q=${encodeURIComponent(concert.location)}`;

  const calendarLink = () => { /* ... Inchangé ... */ return ""; };

  const handlePlayVideo = (index: number) => { pause(500); setPlayingVideos(prev => [...prev, index]); };

  // Helper pour ajouter une vidéo à la liste noire si elle échoue
  const handleVideoError = (idx: number) => {
    setFailedVideos(prev => {
      if (!prev.includes(idx)) return [...prev, idx];
      return prev;
    });
  };

  const images = Array.isArray(concert.imageUrl) ? concert.imageUrl : [];
  const videos = Array.isArray(concert.videoUrl) ? concert.videoUrl : [];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-10 animate-fade-in px-4 mb-12">
      <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline w-fit cursor-none">◀ Retour</button>

      {/* --- INFOS --- */}
      <div className="bg-[#0a0a0a] border border-primary p-8 md:p-10 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.1)]">
        <h1 className="neon text-4xl mb-6">{concert.name}</h1>
        <div className="flex flex-col gap-4">
          <a href={calendarLink()} target="_blank" rel="noreferrer" className="text-primary hover:text-white transition-all w-fit cursor-none flex items-center gap-2">
            <span className="text-xl">📅</span> <span className="text-lg font-bold tracking-wide">{formattedDate}</span>
          </a>
          <a href={mapsLink} target="_blank" rel="noreferrer" className="text-sm opacity-70 hover:text-primary transition-all w-fit cursor-none flex items-center gap-2">
            <span className="text-lg">📍</span> <span className="tracking-wide">{concert.location}</span>
          </a>
        </div>
        {concert.description && (
          <p className="mt-8 text-base opacity-90 border-l-2 border-primary pl-5 py-2 italic leading-relaxed bg-white/5 rounded-r-lg">
            {concert.description}
          </p>
        )}
      </div>

      {/* --- MÉDIAS MULTIPLES --- */}
      {(images.length > 0 || videos.length > 0) && (
        <div className="bg-[#050505] border border-gray-800 p-8 rounded-xl">
          <h2 className="text-xl font-bold text-gray-400 mb-8 border-b border-gray-800 pb-3 font-['Press_Start_2P'] text-[12px] tracking-widest">
            {new Date(concert.date).getTime() > Date.now() ? 'TEASERS' : 'SOUVENIRS'}
          </h2>
          
          <div className="flex flex-col gap-8">
            
            {/* PHOTOS (Flexbox intelligent) */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {images.map((imgUrl, idx) => (
                  // flex-1 permet à l'image de grandir si elle est seule, min-w force le passage à la ligne s'il y en a trop
                  <div key={idx} className="flex-1 min-w-[280px] md:min-w-[320px] max-w-full rounded-xl overflow-hidden border border-gray-800 bg-black/50">
                    <img 
                      src={imgUrl} 
                      alt={`Photo ${idx + 1} de ${concert.name}`} 
                      className="w-full h-full max-h-[400px] object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                        e.currentTarget.classList.add('opacity-50', 'grayscale');
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* VIDÉOS (Flexbox intelligent) */}
            {videos.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {videos.map((vidUrl, idx) => {
                  if (failedVideos.includes(idx)) return null;

                  const ytId = getYoutubeId(vidUrl);
                  const isPlaying = playingVideos.includes(idx);

                  return (
                    // Même principe : flex-1 pour occuper l'espace restant
                    <div key={idx} className="flex-1 min-w-[280px] md:min-w-[320px] max-w-full">
                      {ytId ? (
                        <div className="rounded-xl overflow-hidden border border-gray-800 relative aspect-video bg-black shadow-[0_0_15px_rgba(0,255,204,0.1)] transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,255,204,0.3)]">
                          {!isPlaying ? (
                            <div className="absolute inset-0 cursor-none group" onClick={() => handlePlayVideo(idx)}>
                              <img 
                                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} 
                                alt="Miniature YouTube" 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                                onError={() => handleVideoError(idx)}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.8)] group-hover:scale-110 transition-transform duration-300">
                                  <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <iframe className="w-full h-full absolute inset-0" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} title="Lecteur YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-gray-800 bg-black shadow-[0_0_15px_rgba(0,255,204,0.1)]">
                          <video 
                            controls 
                            className="w-full aspect-video object-contain cursor-none"
                            onPlay={() => pause(500)}
                            preload="metadata"
                            onError={() => handleVideoError(idx)}
                          >
                            <source src={vidUrl} />
                          </video>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SETLIST --- */}
      <div className="bg-[#050505] border border-gray-800 p-8 rounded-xl">
        <h2 className="text-xl font-bold text-primary mb-8 border-b border-gray-800 pb-3 font-['Press_Start_2P'] text-[12px] tracking-widest">SETLIST</h2>
        {setlist.length === 0 ? (
          <p className="text-center opacity-50 italic py-4">La setlist n'est pas encore disponible.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {setlist.map((ct, i) => (
              <div key={i} className="flex items-center gap-5 bg-base-200 p-5 rounded-lg border border-gray-800 hover:border-primary/50 transition-all">
                <span className="opacity-30 font-['Press_Start_2P'] text-[10px] w-8">{String(i + 1).padStart(2, '0')}</span>
                {ct.is_secret && dateObj.valueOf()>Date.now() ? (
                  <span className="text-purple-500 font-bold tracking-[0.2em] animate-pulse">????????</span>
                ) : (
                  <Link to={`/track/${ct.track_id}`} className="text-white font-bold flex-1 hover:text-primary transition-colors cursor-none">
                    <span className="text-lg">{ct.tracks.title}</span>
                    <span className="block text-xs opacity-50 font-normal uppercase mt-1 tracking-widest">{ct.tracks.game}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}