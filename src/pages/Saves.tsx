import { concerts } from "../data/concerts";
import ConcertCard from "../components/ConcertCard";

export default function Saves() {
  return (
    <div className="p-6">
      <h1 className="neon mb-6">Older Saves</h1>

      <div className="grid gap-4">
        {concerts.past.map((c, i) => (
          <ConcertCard key={i} {...c} />
        ))}
      </div>
    </div>
  );
}