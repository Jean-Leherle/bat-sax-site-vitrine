import { Link, useLocation } from "react-router-dom";
import AudioPlayer from './AudioPlayer'

export default function Navbar() {
  const { pathname } = useLocation();

  const linkClass = (path: string) =>
    `btn btn-sm cursor-none transition-all duration-300 ${
      pathname === path 
        ? "btn-primary shadow-[0_0_10px_#00ffcc]" 
        : "btn-ghost hover:text-primary hover:border-primary hover:shadow-[0_0_10px_#00ffcc]"
    }`;

  return (
    <div className="navbar bg-base-200 border-b border-base-300 px-3 md:px-6 justify-between">
      
      <div className="flex-none">
        <Link to="/" className="flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-none">
          <img 
            src="/LogoBatsaxV1.webp" 
            alt="Logo BatSax" 
            className="h-8 w-auto object-contain drop-shadow-[0_0_5px_#00ffcc]" 
          />
          
          <span className="hidden md:inline-block text-xl neon hover:text-white hover:animate-pulse">
            BatSax
          </span>
        </Link>
      </div>

      {/* Lecteur Audio */}
      <div className="flex-none">
        <AudioPlayer />
      </div>

      {/* Menus de Navigation */}
      <div className="flex gap-1 md:gap-4 ml-1 md:ml-2">
        <Link to="/next" className={linkClass("/next")}>
          Prochain boss
        </Link>
        <Link to="/saves" className={linkClass("/saves")}>
          {/* "Sauvegardes" suffit sur mobile pour gagner de la place */}
          <span className="md:hidden">Saves</span>
          <span className="hidden md:inline">Sauvegardes</span>
        </Link>
      </div>
    </div>
  );
}