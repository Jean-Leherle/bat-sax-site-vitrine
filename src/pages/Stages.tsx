import { useEffect, useState } from "react";
import ConcertCard from "../components/ConcertCard";
import Loading from "../components/Loading";
import { supabase } from "../supabaseClient";
import { useAudio } from "../contexts/AudioContext"; 

type Props = {
  mode: "upcoming" | "past";
};

export type Concert = {
  id: number;
  name: string;
  date: string;
  time?: string; // format "HH:mm"
  location: string;
  locationLink?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
};

export default function Stages({ mode }: Props) {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  const title = mode === "upcoming" ? "▶ Prochain boss" : "Sauvegardes précédentes";
  const jokeSource = ['ton petit frere', 'ton chat', 'le pape', 'Chuck Norris (RIP)', 'un Enderman', 'Bowser', 'ta mère'];

  const { playRandomTrack } = useAudio();

  useEffect(() => {
    playRandomTrack([
      { title: "Spear of Justice", url: "/music/Spear_of_Justice.ogg" },
      { title: "Undyne", url: "/music/Undyne.ogg" }
    ]);
  }, [mode, playRandomTrack]);

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

      const minimumDelay = new Promise(resolve => setTimeout(resolve, 1000));
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

  if (loading) return <Loading />;

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="neon mb-12 text-3xl">{title}</h1>

      {concerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center opacity-50 py-10 gap-4 mt-8">
          <span className="text-4xl grayscale">💽</span>
          <p className="text-sm tracking-widest uppercase font-['Press_Start_2P'] text-center leading-loose">
            Sauvegarde supprimée par <br/> {jokeSource[Math.floor(Math.random()*jokeSource.length)]}
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