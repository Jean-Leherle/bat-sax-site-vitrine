import { concerts } from "../data/concerts";
import ConcertCard from "../components/ConcertCard";

export default function NextStage() {
  return (
    <div className="p-6">
      <h1 className="neon mb-6">Next Stage</h1>

      <div className="grid gap-4">
        {concerts.upcoming.map((c, i) => (
          <ConcertCard key={i} {...c} />
        ))}
      </div>
    </div>
  );
}