import { useState, useEffect } from "react";

// --- DÉFINITIONS DES TYPES ---
type Instrument = {
  name: string;
  photoUrl?: string; 
};

type CustomField = {
  label: string;
  icon: string;
  values: string[];
};

type Member = {
  name: string;
  description: string;
  photoUrl: string;
  instruments: Instrument[];
  customFields: CustomField[];
};

export default function Credits() {
  // --- LES DONNÉES ---
  const members: Member[] = [
    {
      name: "Pierre",
      description: "Il se débrouille bien pour arranger les morceaux, mais pas plus d'un par semaine.",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=Pierre",
      instruments: [
        { name: "Saxophone Alto" },
        { name: "Mélodica à ses heures perdues"}
      ],
      customFields: [
        { label: "Citation préférée", icon: "💬", values: ["« Pas plus d'un par semaine ! »", "« J'ai dit pas plus d'un par semaine, hein Jean ! »", "« On reprend à B pour Jean »", "« Moins vite William, moins vite ! »"] },
        { label: "Musique préférée", icon: "🎵", values: ["Dire Dire Docks (Mario 64)"] },
        { label: "Jeu préféré", icon: "🎮", values: ["Wordle"] },
        { label : "Saveur de yaourt préférée", icon: "🥛", values: ["Noix de coco"] }
      ]
    },
    {
      name: "William",
      description: "Il peut jouer de presque 10 instruments différents mais n'est toujours pas capable de jouer au bon tempo.",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=William",
      instruments: [
        { name: "Saxophone Soprano" }
      ],
      customFields: [
        { label: "Citation préférée", icon: "💬", values: ["« Paul je comprends pas ce que tu dis »", "« Venez on le refait mais 10x plus vite »"] },
        { label: "Musique préférée", icon: "🎵", values: ["Rayman origins : food boss"] },
        { label: "Jeu préféré", icon: "🎮", values: ["Portal", "Rayman origins"] },
        { label: "Passion envahissante", icon: "👀", values: ["Doctor Who", "Doctor Who ?", "Parfois, Doctor Who ...", "Un peu (trop) Doctor Who", "Doctor Qui ?"]}
      ]
    },
    {
      name: "Jean",
      description: "Plus c'est grave mieux c'est, et si en plus c'est dans le cadre d'une folie il en sera assurément !",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=Jean",
      instruments: [
        { name: "Saxophone Baryton" },
        { name: "Mélodica"},
        { name: "j-sax"}
      ],
      customFields: [
        { label: "Citation préférée", icon: "💬", values: ["« Je connais un très bon club de kung fu »"] },
        { label: "Musique préférée", icon: "🎵", values: ["Claire obscure : Monoco theme"] },
        { label: "Jeu préféré", icon: "🎮", values: ["Sifu", "Claire obscure (oui c'est d'un banal...)", "OuterWild"] }
      ]
    },
    {
      name: "Paul",
      description: "Le boss de la batterie. Même pas besoin de partoche, l'adaptation c'est sa clé !",
      photoUrl: "https://placehold.co/400x400/1a1a1a/00ffcc?text=Paul",
      instruments: [
        { name: "Batterie" },
        { name: "Piano" }
      ],
      customFields: [
        { label: "Citation préférée", icon: "💬", values: ["« Je vois pas vos pieds ! »"] },
        { label: "Musique préférée", icon: "🎵", values: ["Whiplash"] },
        { label: "Jeu préféré", icon: "🎮", values: ["Doom Eternal", "Crypt of the NecroDancer"] }
      ]
    },
  ];

  // --- LES ÉTATS ---
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Le minuteur global automatique
  const [tick, setTick] = useState(0);
  
  const [manualOffsets, setManualOffsets] = useState<Record<string, number>>({});

  // Réinitialiser les décalages quand on change de membre (pour que ça reparte à zéro propre)
  useEffect(() => {
    setManualOffsets({});
  }, [selectedMember]);

  const handleManualTick = (e: React.MouseEvent, fieldKey: string) => {
    e.stopPropagation();
    setManualOffsets(prev => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || 0) + 1 // Ajoute +1 seulement à ce champ !
    }));
  };

  // Le minuteur de 10 secondes (il ne se remet plus à zéro au clic, il tourne en fond tranquillement)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleCloseModal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedMember(null);
    }
  };

  const hasAnyMultipleValues = (member: Member) => {
    return member.instruments.length > 1 || member.customFields.some(field => field.values.length > 1);
  };

  return (
    <div className="p-6 text-center flex flex-col items-center w-full relative">
      <h1 className="neon text-3xl mb-2">Crédits</h1>
      <p className="text-sm opacity-70 mb-8">L'équipe batSax</p>

      {/* GRILLE DES MEMBRES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {members.map((member, i) => {
          const currentInstrument = member.instruments[0];
          
          return (
            <div
              key={i}
              onClick={() => setSelectedMember(member)}
              className="border border-primary p-4 rounded-xl hover:scale-105 transition-all hover:shadow-[0_0_15px_#00ffcc] bg-[#0a0a0a] cursor-none overflow-hidden"
            >
              <h2 className="neon text-lg">{member.name}</h2>
              <p key={currentInstrument.name} className="text-sm mt-1 opacity-80 animate-slide-right">
                {currentInstrument.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* MODALE DE PRÉSENTATION */}
      {selectedMember && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#0a0a0a] border border-primary shadow-[0_0_30px_rgba(0,255,204,0.2)] rounded-xl p-6 w-full max-w-md relative animate-pop-in">
            
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-primary opacity-70 hover:opacity-100 hover:scale-110 transition-all font-bold text-xl cursor-none"
            >
              ✕
            </button>

            <div className="flex flex-col items-center gap-4 text-left mt-2">
              
              <img
                src={selectedMember.photoUrl}
                alt={selectedMember.name}
                className="w-32 h-32 rounded-full border-2 border-primary shadow-[0_0_15px_#00ffcc] object-cover"
              />

              <div className="w-full text-center mb-2 overflow-hidden">
                <h2 className="neon text-2xl">{selectedMember.name}</h2>
                
                {(() => {
                  const instTotalTicks = tick + (manualOffsets['instruments'] || 0);
                  const currentInst = selectedMember.instruments[instTotalTicks % selectedMember.instruments.length];
                  const isMultipleInst = selectedMember.instruments.length > 1;

                  return (
                    <div 
                      key={currentInst.name} 
                      onClick={(e) => isMultipleInst ? handleManualTick(e, 'instruments') : undefined}
                      className={`flex items-center justify-center gap-2 mt-2 animate-slide-right transition-all cursor-none ${
                        isMultipleInst ? 'hover:scale-110 hover:text-white' : ''
                      }`}
                      title={isMultipleInst ? "Cliquez pour voir le suivant" : undefined}
                    >
                      <p className="text-primary font-['Press_Start_2P'] text-[10px] tracking-widest leading-loose">
                        {currentInst.name}
                      </p>
                      {currentInst.photoUrl && (
                        <img 
                          src={currentInst.photoUrl} 
                          alt={currentInst.name} 
                          className="w-6 h-6 rounded border border-primary object-cover"
                        />
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="w-full space-y-4 text-sm opacity-90 mt-2">
                <p className="bg-white/5 p-3 rounded border border-gray-800 text-center">
                  {selectedMember.description}
                </p>

                {selectedMember.customFields.map((field, idx) => {
                  const fieldTotalTicks = tick + (manualOffsets[field.label] || 0);
                  const currentValue = field.values[fieldTotalTicks % field.values.length];
                  const isMultipleValue = field.values.length > 1;

                  return (
                    <div key={idx} className="overflow-hidden">
                      <span className="text-primary text-xs uppercase font-bold tracking-wider">
                        {field.label}
                      </span>
                      <p 
                        className={`mt-1 flex items-start gap-2 transition-opacity cursor-none ${
                          isMultipleValue ? 'hover:opacity-100 opacity-80' : ''
                        }`}
                        onClick={(e) => isMultipleValue ? handleManualTick(e, field.label) : undefined}
                        title={isMultipleValue ? "Cliquez pour faire défiler" : undefined}
                      >
                        <span className="text-lg grayscale shrink-0">{field.icon}</span>
                        <span 
                          key={currentValue} 
                          className={`italic pl-1 border-l-2 border-primary/50 text-gray-300 animate-slide-right inline-block transition-colors ${
                            isMultipleValue ? 'hover:text-white' : ''
                          }`}
                        >
                          {currentValue}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}