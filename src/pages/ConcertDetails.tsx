import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ConcertDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [concert, setConcert] = useState<any>(null);
  const [setlist, setSetlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcertData = async () => {
      if (!id) return;
      const { data: concertData } = await supabase.from("concerts").select("*").eq("id", id).single();
      if (concertData) setConcert(concertData);

      const { data: setlistData } = await supabase.from("concert_tracks").select("*, tracks(*)").eq("concert_id", id).order("play_order", { ascending: true });
      if (setlistData) setSetlist(setlistData);
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

  const calendarLink = () => {
    const startDate = new Date(datePart);
    let startStr = "", endStr = "";
    if (hasTime) {
      const [hours, minutes] = timePart.split(':');
      startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);
      const formatDT = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
      startStr = formatDT(startDate); endStr = formatDT(endDate);
    } else {
      startStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
      const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 1);
      endStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
    }
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('batSax : ' + concert.name)}&dates=${startStr}/${endStr}&location=${encodeURIComponent(concert.location)}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-10 animate-fade-in px-4 mb-12">
      <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline w-fit cursor-none">◀ Retour</button>

      <div className="bg-[#0a0a0a] border border-primary p-8 md:p-10 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.1)]">
        <h1 className="neon text-4xl mb-6">{concert.name}</h1>
        
        <div className="flex flex-col gap-4">
          <a href={calendarLink()} target="_blank" rel="noreferrer" className="text-primary hover:text-white transition-all w-fit cursor-none flex items-center gap-2">
            <span className="text-xl">📅</span> 
            <span className="text-lg font-bold tracking-wide">{formattedDate}</span>
          </a>
          <a href={mapsLink} target="_blank" rel="noreferrer" className="text-sm opacity-70 hover:text-primary transition-all w-fit cursor-none flex items-center gap-2">
            <span className="text-lg">📍</span> 
            <span className="tracking-wide">{concert.location}</span>
          </a>
        </div>

        {concert.description && (
          <p className="mt-8 text-base opacity-90 border-l-2 border-primary pl-5 py-2 italic leading-relaxed bg-white/5 rounded-r-lg">
            {concert.description}
          </p>
        )}
      </div>

      <div className="bg-[#050505] border border-gray-800 p-8 rounded-xl">
        <h2 className="text-xl font-bold text-primary mb-8 border-b border-gray-800 pb-3 font-['Press_Start_2P'] text-[12px] tracking-widest">SETLIST</h2>
        
        <div className="flex flex-col gap-4">
          {setlist.map((ct, i) => (
            <div key={i} className="flex items-center gap-5 bg-base-200 p-5 rounded-lg border border-gray-800 hover:border-primary/50 transition-all">
              <span className="opacity-30 font-['Press_Start_2P'] text-[10px] w-8">{String(i + 1).padStart(2, '0')}</span>
              {ct.is_secret ? (
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
      </div>
    </div>
  );
}