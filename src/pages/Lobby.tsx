import { Link } from "react-router-dom";
import MiniGame from "../components/MiniGame"; // <-- Import du jeu

export default function Lobby() {
  return (
    // On met en relative pour que le mini-jeu en absolute s'adapte bien
    <div className="relative flex flex-col items-center justify-center w-full min-h-[70vh]">
      
      {/* Le jeu en arrière plan */}
      <MiniGame />

      {/* Le contenu du Lobby (z-10 pour être au dessus du jeu) */}
      <div className="text-center flex flex-col items-center gap-8 z-10 p-6 bg-black/40 rounded-3xl backdrop-blur-sm border border-gray-900">
        <h1 className="text-4xl neon">BatSax</h1>

        <p className="text-sm opacity-70 max-w-md">
          Trio de saxophones + batterie dédié aux musiques de jeux vidéo.
        </p>

        <div className="flex gap-4 mt-4">
          <Link to="/next" className="btn btn-primary">
            ▶ Next Stage
          </Link>

          <Link to="/saves" className="btn btn-outline">
            Older Saves
          </Link>

          <Link to="/credits" className="btn btn-outline">
            Credits
          </Link>
        </div>
      </div>
    </div>
  );
}