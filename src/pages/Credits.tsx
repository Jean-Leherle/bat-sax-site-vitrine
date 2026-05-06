import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Pour gérer ?m=pierre
import { supabase } from "../supabaseClient";

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
  id: number;
  slug: string; // NOUVEAU
  name: string;
  description: string;
  photoUrl: string;
  instruments: Instrument[];
  customFields: CustomField[];
};

export default function Credits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // --- LES ÉTATS DU LECTEUR ---
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [tick, setTick] = useState(0);
  const [manualOffsets, setManualOffsets] = useState<Record<string, number>>({});

  // 1. Récupération des données depuis Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase.from('members').select('*').order('id', { ascending: true });
      if (!error && data) {
        setMembers(data as Member[]);
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  // 2. Gestion du lien direct (Deep Linking)
  useEffect(() => {
    if (members.length > 0) {
      const urlMemberSlug = searchParams.get('m');
      if (urlMemberSlug) {
        const targetMember = members.find(m => m.slug === urlMemberSlug);
        if (targetMember) {
          setSelectedMember(targetMember);
        }
      }
    }
  }, [members, searchParams]);

  // Réinitialiser les décalages quand on change de membre
  useEffect(() => {
    setManualOffsets({});
  }, [selectedMember]);

  // Le minuteur global automatique
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleManualTick = (e: React.MouseEvent, fieldKey: string) => {
    e.stopPropagation();
    setManualOffsets(prev => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || 0) + 1
    }));
  };

  // --- FONCTIONS D'OUVERTURE ET FERMETURE ---
  const openProfile = (member: Member) => {
    setSelectedMember(member);
    setSearchParams({ m: member.slug }); // Met à jour l'URL : ?m=pierre
  };

  const closeProfile = () => {
    setSelectedMember(null);
    searchParams.delete('m'); // Nettoie l'URL quand on ferme la modale
    setSearchParams(searchParams);
  };

  const handleCloseModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeProfile();
    }
  };

  if (loading) return <div className="p-6 text-center neon mt-12">Loading Roster...</div>;

  return (
    <div className="p-6 text-center flex flex-col items-center w-full relative">
      <h1 className="neon text-3xl mb-2">Crédits</h1>
      <p className="text-sm opacity-70 mb-8">L'équipe BatSax</p>

      {/* GRILLE DES MEMBRES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {members.map((member) => {
          // Sécurité au cas où la base de données aurait un JSON mal formé
          const currentInstrument = member.instruments?.[0] || { name: "Instrument inconnu" };
          
          return (
            <div
              key={member.id}
              onClick={() => openProfile(member)}
              className="border border-primary p-4 rounded-xl hover:scale-105 transition-all hover:shadow-[0_0_15px_#00ffcc] bg-[#0a0a0a] cursor-none overflow-hidden"
            >
              <h2 className="neon text-lg">{member.name}</h2>
              <p className="text-sm mt-1 opacity-80 animate-slide-right">
                {currentInstrument.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* MODALE DE PRÉSENTATION */}
      {selectedMember && (
        <div
          onClick={handleCloseModalClick}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#0a0a0a] border border-primary shadow-[0_0_30px_rgba(0,255,204,0.2)] rounded-xl p-6 w-full max-w-md relative animate-pop-in custom-scrollbar overflow-y-auto max-h-[90vh]">
            
            <button
              onClick={closeProfile}
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
                  if (!selectedMember.instruments || selectedMember.instruments.length === 0) return null;
                  
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

                {(selectedMember.customFields || []).map((field, idx) => {
                  if (!field.values || field.values.length === 0) return null;

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