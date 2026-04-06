import { useState } from "react";

// 1. On définit la structure complète d'une fiche personnage
type Member = {
  name: string;
  role: string;
  description: string;
  quote: string;
  favoriteSong: string;
  photoUrl: string;
};

export default function Credits() {
  // 2. On enrichit les données de base
  const members: Member[] = [
    {
      name: "Pierre",
      role: "Saxophone Alto",
      description: "L'arrangement n'a aucun secret pour lui, le sax non plus.",
      quote: "« Pas plus d'un par semaine ! »",
      favoriteSong: "Undertale : Megalovania",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=Pierre", // À remplacer par vos vraies photos
    },
    {
      name: "William",
      role: "Saxophone Soprano",
      description: "Les gammes c'est la base, et à n'en pas douter il a bossé bien plus que les bases !",
      quote: "« trop tôt ! »",
      favoriteSong: "Mortal kombat : stheme",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=William",
    },
    {
      name: "Jean",
      role: "Saxophone Baryton",
      description: "Plus c'est grave mieux c'est, et si en plus c'est dans le cadre d'une folie il en sera assurément !",
      quote: "« Je connais un très bon club de kung fu »",
      favoriteSong: "Claire obscure : Monoco theme",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=Jean",
    },
    {
      name: "Paul",
      role: "Batterie",
      description: "Le boss de la batterie. meme pas besoin de partoche, l'adaptation c'est sa clé !",
      quote: "« Je vois pas vos pieds ! »",
      favoriteSong: "Whiplash ",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=Paul",
    },
  ];

  // 3. L'état qui retient quel membre est actuellement ouvert (null si la modale est fermée)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Fonction pour fermer la modale si on clique dans le vide (autour de la boîte)
  const handleCloseModal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedMember(null);
    }
  };

  return (
    <div className="p-6 text-center flex flex-col items-center w-full relative">
      <h1 className="neon text-3xl mb-2">Crédits</h1>
      <p className="text-sm opacity-70 mb-8">Le roster batSax</p>

      {/* GRILLE DES MEMBRES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {members.map((member, i) => (
          <div
            key={i}
            onClick={() => setSelectedMember(member)}
            // Le clic est maintenant géré, la carte est prête à être cliquée
            className="border border-primary p-4 rounded-xl hover:scale-105 transition-all hover:shadow-[0_0_15px_#00ffcc] bg-[#0a0a0a] cursor-none"
          >
            <h2 className="neon text-lg">{member.name}</h2>
            <p className="text-sm mt-1 opacity-80">{member.role}</p>
          </div>
        ))}
      </div>

      {/* MODALE DE PRÉSENTATION (S'affiche uniquement si selectedMember n'est pas null) */}
      {selectedMember && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Boîte de la modale */}
          <div className="bg-[#0a0a0a] border border-primary shadow-[0_0_30px_rgba(0,255,204,0.2)] rounded-xl p-6 w-full max-w-md relative animate-pop-in">
            
            {/* Bouton Fermer (X) */}
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-primary opacity-70 hover:opacity-100 hover:scale-110 transition-all font-bold text-xl cursor-none"
            >
              ✕
            </button>

            <div className="flex flex-col items-center gap-4 text-left mt-2">
              {/* Photo de profil (avatar carré ou rond) */}
              <img
                src={selectedMember.photoUrl}
                alt={selectedMember.name}
                className="w-32 h-32 rounded-full border-2 border-primary shadow-[0_0_15px_#00ffcc] object-cover"
              />

              {/* Titre et Instrument */}
              <div className="w-full text-center mb-2">
                <h2 className="neon text-2xl">{selectedMember.name}</h2>
                <p className="text-primary font-['Press_Start_2P'] text-[10px] mt-2 tracking-widest leading-loose">
                  {selectedMember.role}
                </p>
              </div>

              {/* Détails du personnage */}
              <div className="w-full space-y-4 text-sm opacity-90 mt-2">
                <p className="bg-white/5 p-3 rounded border border-gray-800 text-center">
                  {selectedMember.description}
                </p>

                <div>
                  <span className="text-primary text-xs uppercase font-bold tracking-wider">💬 Favorite Quote</span>
                  <p className="italic mt-1 pl-3 border-l-2 border-primary/50 text-gray-300">
                    {selectedMember.quote}
                  </p>
                </div>

                <div>
                  <span className="text-primary text-xs uppercase font-bold tracking-wider">🎵 Favorite Stage</span>
                  <p className="mt-1 flex items-center gap-2">
                    <span className="text-lg grayscale">💿</span> {selectedMember.favoriteSong}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}