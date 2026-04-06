type Props = {
  date: string;
  name: string;
  location: string;
};

export default function ConcertCard({ date, name, location }: Props) {
  return (
    <div className="border border-primary p-4 rounded-xl hover:scale-105 transition-all hover:shadow-[0_0_15px_#00ffcc]">
      <h2 className="neon text-sm">{name}</h2>
      <p className="text-xs mt-2">{date}</p>
      <p className="text-xs opacity-70">{location}</p>
    </div>
  );
}