import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-6 w-full">
      {/* Le 404 en géant, on peut lui forcer une couleur un peu "erreur" comme le rouge ou le garder neon classique */}
      <h1 className="text-8xl neon text-red-500 mb-4">404</h1>
      
      <div className="flex flex-col items-center gap-4">
        <span className="text-5xl grayscale opacity-80">👾</span>
        <h2 className="text-xl font-['Press_Start_2P'] uppercase tracking-widest leading-loose">
          Level Not Found
        </h2>
      </div>

      <p className="opacity-70 max-w-md text-sm mt-4">
        La partition que tu cherches semble avoir été corrompue ou n'a jamais existé.
      </p>

      <Link to="/" className="btn btn-primary mt-8 font-['Press_Start_2P'] text-[10px] tracking-widest">
        RETURN TO LOBBY
      </Link>
    </div>
  );
}