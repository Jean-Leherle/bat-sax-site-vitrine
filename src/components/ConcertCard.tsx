import { useState, useEffect } from "react";
import type { Concert } from "../pages/Stages";

type Props = {
  concert: Concert;
  isPast: boolean;
};

export default function ConcertCard({ concert, isPast }: Props) {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem(`batsax-stage-${concert.id}`);
    if (savedState === "true") {
      setIsCompleted(true);
    }
  }, [concert.id]);

  const toggleCompleted = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    localStorage.setItem(`batsax-stage-${concert.id}`, String(newState));
  };

  const formattedDate = new Date(concert.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + (concert.time ? ` à ${concert.time.replace(':', 'h')}` : ''); // ex: "à 20h30"

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(concert.location)}`;

  const generateCalendarLink = () => {
    const startDate = new Date(concert.date);
    let startStr = "";
    let endStr = "";

    if (concert.time) {
      // S'il y a une heure (ex: "20:30")
      const [hours, minutes] = concert.time.split(':');
      startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2); // On estime la durée à 2 heures

      // Format requis par Google pour les événements avec heure exacte : YYYYMMDDTHHMMSS
      const formatDT = (d: Date) => 
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;

      startStr = formatDT(startDate);
      endStr = formatDT(endDate);
    } else {
      // S'il n'y a pas d'heure (Événement sur la journée entière)
      startStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      endStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
    }

    const title = encodeURIComponent(`batSax : ${concert.name}`);
    const location = encodeURIComponent(concert.location);
    const details = encodeURIComponent(concert.description || "Retrouvez le trio batSax en concert !");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  return (
    <div className={`border p-4 rounded-xl transition-all bg-[#0a0a0a] hover:shadow-[0_0_15px_#00ffcc] ${isCompleted ? 'border-green-500' : 'border-primary'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="neon text-lg">{concert.name}</h2>
          
          <a 
            href={generateCalendarLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm opacity-90 text-primary hover:text-white transition-colors inline-block hover:scale-105"
            title="Ajouter à Google Agenda"
          >
            <span className="hover:animate-pulse">📅 {formattedDate}</span>
          </a>
          <br/>
          
          <a 
            href={concert.locationLink || mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs opacity-70 mt-1 inline-block hover:text-primary transition-colors hover:scale-105 cursor-none"
          >
            📍 {concert.location}
          </a>
        </div>
        
        {isPast && (
          <button 
            onClick={toggleCompleted}
            className={`btn btn-xs font-['Press_Start_2P'] text-[8px] p-4 cursor-none ${
              isCompleted 
                ? 'bg-green-500 hover:bg-green-600 text-black border-none' 
                : 'btn-outline border-gray-500 text-gray-400 hover:border-green-500 hover:text-green-500'
            }`}
          >
            {isCompleted ? 'Perfect !' : 'Concert réussi ?'}
          </button>
        )}
      </div>

      {concert.description && (
        <p className="text-sm mt-4 opacity-80">{concert.description}</p>
      )}

      {/* Zone Médias */}
      {isPast && (concert.imageUrl || concert.videoUrl) && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          {concert.imageUrl && (
            <img 
              src={concert.imageUrl} 
              alt={`Souvenir de ${concert.name}`} 
              className="w-full h-48 object-cover rounded mb-2 border border-gray-700"
            />
          )}
          {concert.videoUrl && (
            <a 
              href={concert.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline cursor-none"
            >
              ▶ Voir la vidéo du concert
            </a>
          )}
        </div>
      )}
    </div>
  );
}