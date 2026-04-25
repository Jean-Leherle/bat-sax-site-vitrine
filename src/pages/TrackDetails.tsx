import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAudio } from "../contexts/AudioContext"; // NOUVEAU : Import du lecteur audio

// Petite fonction pour extraire l'ID YouTube (gère les liens youtu.be, watch?v=, embed/...)
const getYoutubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

export default function TrackDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pause } = useAudio(); // On récupère notre fonction pour couper le son
  
  const [track, setTrack] = useState<any>(null);
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false); // État pour la bascule Image -> Lecteur Vidéo

  useEffect(() => {
    const fetchTrackData = async () => {
      if (!id) return;
      const { data: trackData } = await supabase.from("tracks").select("*").eq("id", id).single();
      if (trackData) setTrack(trackData);

      const { data: concertData } = await supabase.from("concert_tracks").select("concerts(*)").eq("track_id", id);
      if (concertData) {
        const formatted = concertData.map(cd => cd.concerts).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setConcerts(formatted);
      }
      setLoading(false);
    };
    fetchTrackData();
  }, [id]);

  if (loading) return <div className="text-center neon mt-12">Loading Track Data...</div>;
  if (!track) return <div className="text-center mt-12 text-red-500">Morceau introuvable.</div>;

  const today = new Date().getTime();
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  // On extrait l'ID si le morceau possède un lien YouTube
  const ytId = track.youtube_link ? getYoutubeId(track.youtube_link) : null;

  const handlePlayVideo = () => {
    pause(500); // 1. On baisse la musique du site en douceur (500ms)
    setShowVideo(true); // 2. On affiche le lecteur YouTube
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 animate-fade-in px-4">
      <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline w-fit cursor-none">◀ Retour</button>

      <div className="bg-[#0a0a0a] border border-primary p-8 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.1)]">
        <h1 className="neon text-4xl mb-1">{track.title}</h1>
        <h2 className="text-lg opacity-80 uppercase tracking-widest mb-8 text-primary/80">{track.franchise} — {track.game}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-base-200 p-4 rounded border border-gray-800">
            <span className="text-[10px] opacity-50 block mb-1 font-bold">DURÉE ESTIMÉE</span>
            <span className="text-sm font-bold text-white">{track.duration || "N/A"}</span>
          </div>
          <div className="bg-base-200 p-4 rounded border border-gray-800">
            <span className="text-[10px] opacity-50 block mb-1 font-bold">ARRANGÉ PAR</span>
            <span className="text-sm font-bold text-white">{track.arranger || "batSax"}</span>
          </div>
          <div className="bg-base-200 p-4 rounded border border-gray-800">
            <span className="text-[10px] opacity-50 block mb-1 font-bold">NIVEAU DE MAÎTRISE</span>
            <span className="text-sm font-bold text-primary neon-text">{track.play_status}</span>
          </div>
        </div>

        {track.description && (
          <p className="text-base opacity-90 leading-relaxed bg-white/5 p-6 rounded-lg italic border-l-4 border-primary/30">
            "{track.description}"
          </p>
        )}

        {/* --- NOUVEAU BLOC YOUTUBE --- */}
        {track.youtube_link && (
          <div className="mt-8">
            {ytId ? (
              <div className="rounded-xl overflow-hidden border border-gray-800 relative aspect-video bg-black shadow-[0_0_15px_rgba(0,255,204,0.1)] transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,255,204,0.3)]">
                {!showVideo ? (
                  // FAÇADE : La miniature avec le faux bouton play
                  <div className="absolute inset-0 cursor-none group" onClick={handlePlayVideo}>
                    {/* hqdefault.jpg est l'image miniature officielle la plus fiable de YouTube */}
                    <img 
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} 
                      alt="Miniature YouTube" 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.8)] group-hover:scale-110 transition-transform duration-300">
                        
                        <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        
                      </div>
                    </div>
                  </div>
                ) : (
                  // LECTEUR RÉEL : Apparaît au clic et se lance tout seul
                  <iframe 
                    className="w-full h-full absolute inset-0"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} 
                    title="Lecteur YouTube" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                )}
              </div>
            ) : (
              // Fallback de sécurité au cas où le lien n'est pas un lien YouTube standard
              <a href={track.youtube_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-outline w-full cursor-none">
                ▶ ÉCOUTER SUR YOUTUBE
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#050505] p-6 border border-gray-800 rounded-xl">
          <h3 className="text-primary font-bold mb-6 font-['Press_Start_2P'] text-[10px]">NEXT STAGES</h3>
          <div className="flex flex-col gap-3">
            {concerts.filter(c => new Date(c.date).getTime() >= today).length === 0 && <p className="text-xs opacity-50 italic">Aucune date prévue...</p>}
            {concerts.filter(c => new Date(c.date).getTime() >= today).map(c => (
              <Link key={c.id} to={`/concert/${c.id}`} className="block bg-base-200 p-3 rounded border border-transparent hover:border-primary transition-all cursor-none">
                <span className="text-[10px] opacity-50 block">📅 {fmt(c.date)}</span>
                <span className="text-sm font-bold">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-[#050505] p-6 border border-gray-800 rounded-xl opacity-80">
          <h3 className="text-gray-400 font-bold mb-6 font-['Press_Start_2P'] text-[10px]">STAGES COMPLETED</h3>
          <div className="flex flex-col gap-3">
            {concerts.filter(c => new Date(c.date).getTime() < today).length === 0 && <p className="text-xs opacity-50 italic">Jamais joué en public.</p>}
            {concerts.filter(c => new Date(c.date).getTime() < today).map(c => (
              <Link key={c.id} to={`/concert/${c.id}`} className="block bg-base-200 p-3 rounded border border-transparent hover:border-gray-500 transition-all cursor-none">
                <span className="text-[10px] opacity-50 block">📅 {fmt(c.date)}</span>
                <span className="text-sm font-bold">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}