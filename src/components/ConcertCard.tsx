import { useState, useEffect } from "react";
import type { Concert } from "../pages/Stages";

type Props = {
  concert: Concert;
  isPast: boolean;
};

export default function ConcertCard({ concert, isPast }: Props) {
  // État local pour savoir si le stage est complété
  const [isCompleted, setIsCompleted] = useState(false);

  // Au chargement du composant, on vérifie la "carte mémoire" (localStorage)
  useEffect(() => {
    const savedState = localStorage.getItem(`batsax-stage-${concert.id}`);
    if (savedState === "true") {
      setIsCompleted(true);
    }
  }, [concert.id]);

  // Fonction pour basculer l'état
  const toggleCompleted = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    // On sauvegarde dans le navigateur de l'utilisateur
    localStorage.setItem(`batsax-stage-${concert.id}`, String(newState));
  };

  const formattedDate = new Date(concert.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(concert.location)}`;

  return (
    <div className={`border p-4 rounded-xl transition-all bg-[#0a0a0a] hover:shadow-[0_0_15px_#00ffcc] ${isCompleted ? 'border-green-500' : 'border-primary'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="neon text-lg">{concert.name}</h2>
          <p className="text-sm opacity-90 text-primary">{formattedDate}</p>
          
          <a 
            href={concert.locationLink ||mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs opacity-70 mt-1 inline-block hover:text-primary transition-colors cursor-none"
          >
            📍 {concert.location}
          </a>
        </div>
        
        {/* Affichage conditionnel des boutons */}
        {isPast ? (
          <button 
            onClick={toggleCompleted}
            className={`btn btn-xs font-['Press_Start_2P'] text-[8px] cursor-none ${
              isCompleted 
                ? 'bg-green-500 hover:bg-green-600 text-black border-none' 
                : 'btn-outline border-gray-500 text-gray-400 hover:border-green-500 hover:text-green-500'
            }`}
          >
            {isCompleted ? '✓ COMPLETED' : 'MARK COMPLETED'}
          </button>
        ) : (
          <button className="btn btn-xs btn-primary font-['Press_Start_2P'] text-[8px] cursor-none opacity-50 cursor-not-allowed">
            LOCKED
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