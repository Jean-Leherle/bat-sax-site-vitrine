export default function Credits() {
  const members = [
    { role: "Saxophone Alto", name: "Pierre" },
    { role: "Saxophone Soprano", name: "William" },
    { role: "Saxophone Baryton", name: "Jean" },
    { role: "Batterie", name: "Paul" },
  ];

  return (
    <div className="p-6 text-center flex flex-col items-center">
      <h1 className="neon text-3xl mb-2">Crédits</h1>
      <p className="text-sm opacity-70 mb-8">Le roaster batSax</p>

      <div className="grid gap-6 w-full max-w-md">
        {members.map((member, i) => (
          <div 
            key={i} 
            className="border border-primary p-4 rounded-xl hover:scale-105 transition-all hover:shadow-[0_0_15px_#00ffcc] bg-[#0a0a0a]"
          >
            <h2 className="neon text-lg">{member.name}</h2>
            <p className="text-sm mt-1 opacity-80">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}