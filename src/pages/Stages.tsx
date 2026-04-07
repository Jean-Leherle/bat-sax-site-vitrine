import { useEffect, useState } from "react";
import ConcertCard from "../components/ConcertCard";
import Loading from "../components/Loading"; // 1. On importe votre composant
import { supabase } from "../supabaseClient";

type Props = {
  mode: "upcoming" | "past";
};

export type Concert = {
  id: number;
  name: string;
  date: string;
  location: string; // "Le Gotham - Troyes"
  locationLink?: string; // "https://maps.app.goo.gl/..." (le vrai lien de partage Google Maps)
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
};

export default function Stages({ mode }: Props) {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  const title = mode === "upcoming" ? "▶ Prochain boss" : "Sauvegardes précédentes";
  const jokeSource = ['ton petit frere', 'ton chat', 'le pape', 'Chuck Norris (RIP)', 'un Enderman', 'Bowser', 'ta mère', ]

  useEffect(() => {
    async function fetchConcerts() {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      let query = supabase.from('concerts').select('*');

      if (mode === "upcoming") {
        query = query.gte('date', today).order('date', { ascending: true });
      } else {
        query = query.lt('date', today).order('date', { ascending: false });
      }

      // 2. On crée une promesse qui se résout au bout de 1500ms (1.5s)
      const minimumDelay = new Promise(resolve => setTimeout(resolve, 1000));

      // 3. On attend que la requête Supabase ET le délai de 1.5s soient terminés
      const [response] = await Promise.all([query, minimumDelay]);
      
      const { data, error } = response;

      if (error) {
        console.error("Erreur :", error);
      } else {
        setConcerts(data || []);
      }
      
      setLoading(false);
    }

    fetchConcerts();
  }, [mode]);

  // 4. On utilise votre composant au lieu du simple texte
  if (loading) return <Loading />;

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="neon mb-12 text-3xl">{title}</h1>

      {concerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center opacity-50 py-10 gap-4 mt-8">
          <span className="text-4xl grayscale">💽</span>
          <p className="text-sm tracking-widest uppercase font-['Press_Start_2P'] text-center leading-loose">
            Sauvegarde supprime par <br/> {jokeSource[Math.floor(Math.random()*jokeSource.length)]}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 w-full">
          {concerts.map((c) => (
            <ConcertCard key={c.id} concert={c} isPast={mode === "past"} />
          ))}
        </div>
      )}
    </div>
  );
}