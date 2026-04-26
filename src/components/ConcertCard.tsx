import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Concert } from '../pages/Stages';

type Props = {
  concert: Concert;
  isPast: boolean;
};

export default function ConcertCard({ concert, isPast }: Props) {
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedState = localStorage.getItem(`batsax-stage-${concert.id}`);
    if (savedState === 'true') {
      setIsCompleted(true);
    }
  }, [concert.id]);

  const toggleCompleted = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    localStorage.setItem(`batsax-stage-${concert.id}`, String(newState));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    navigate(`/concert/${concert.id}`);
  };

  const dateStr = concert.date;
  const datePart = dateStr.split(/[\sT]/)[0];
  const timePart =
    dateStr.includes('T') || dateStr.includes(' ')
      ? dateStr.split(/[\sT]/)[1].slice(0, 5)
      : '00:00';
  const hasTime = timePart !== '00:00';

  const dateObj = new Date(datePart);
  const formattedDate =
    dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + (hasTime ? ` à ${timePart.replace(':', 'h')}` : '');
    
  // Correction du typo ici
  const mapsLink = concert.locationLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(concert.location)}`;

  const generateCalendarLink = () => {
    const startDate = new Date(datePart);
    let startStr = '';
    let endStr = '';

    if (hasTime) {
      const [hours, minutes] = timePart.split(':');
      startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);

      const formatDT = (d: Date) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;

      startStr = formatDT(startDate);
      endStr = formatDT(endDate);
    } else {
      startStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      endStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
    }

    const title = encodeURIComponent(`batSax : ${concert.name}`);
    const location = encodeURIComponent(concert.location);
    const details = encodeURIComponent(
      concert.description || 'Retrouvez le trio batSax en concert !'
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  return (
    <div
      onClick={handleCardClick}
      // Padding passé à p-6 pour plus d'aération globale
      className={`group border p-6 rounded-xl transition-all bg-[#0a0a0a] hover:shadow-[0_0_20px_#00ffcc] flex flex-col justify-between cursor-none ${isCompleted ? 'border-green-500' : 'border-primary'}`}
    >
      <div className="flex flex-col gap-6">
        
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-3">
            <h2 className="neon text-xl group-hover:text-white transition-colors">
              {concert.name}
            </h2>

            {/* Les liens date et lieu sont maintenant espacés avec gap-2 */}
            <div className="flex flex-col gap-2">
              <a
                href={generateCalendarLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm opacity-90 text-primary hover:text-white transition-colors w-fit hover:scale-105 cursor-none flex items-center gap-2"
                title="Ajouter à Google Agenda"
              >
                <span className="hover:animate-pulse">📅</span> 
                <span>{formattedDate}</span>
              </a>

              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm opacity-70 hover:text-primary transition-colors w-fit hover:scale-105 cursor-none flex items-center gap-2"
              >
                <span>📍</span> 
                <span>{concert.location}</span>
              </a>
            </div>
          </div>

          {isPast && (
            <button
              onClick={toggleCompleted}
              className={`btn btn-xs font-['Press_Start_2P'] text-[8px] p-4 shrink-0 cursor-none ${
                isCompleted
                  ? 'bg-green-500 hover:bg-green-600 text-black border-none shadow-[0_0_10px_#22c55e]'
                  : 'btn-outline border-gray-500 text-gray-400 hover:border-green-500 hover:text-green-500'
              }`}
            >
              {isCompleted ? 'Perfect !' : 'Réussi ?'}
            </button>
          )}
        </div>

        {concert.description && (
          // Même style de description que sur la page détails
          <p className="text-sm opacity-90 leading-relaxed border-l-2 border-primary pl-4 py-2 bg-white/5 rounded-r-lg italic">
            {concert.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 mt-6">
        {isPast && (concert.imageUrl || concert.videoUrl) && (
          <div className="pt-6 border-t border-gray-800">
            {concert.imageUrl && (
              <img
                src={concert.imageUrl}
                alt={`Souvenir de ${concert.name}`}
                className="w-full h-56 object-cover rounded-lg border border-gray-700 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
}