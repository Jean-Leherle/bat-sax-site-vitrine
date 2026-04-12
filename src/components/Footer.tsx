import { Link } from "react-router-dom";

export default function Footer() {
  const mail = 'contact@batsax.fr';

  const linkClass = "hover:text-primary hover:drop-shadow-[0_0_8px_#00ffcc] transition-all duration-150 cursor-none";

  return (
    <footer className="text-center text-xs opacity-60 py-6 border-t border-base-300 flex flex-col gap-2">
      <p>
        © 2026 batSax — {" "}
        <a href="https://harmonie-alerte.fr/" target="_blank" rel="noreferrer" className={linkClass}>
          Association L'Alerte
        </a> 
        {" "}— Troyes
      </p>
      
      <div className="flex justify-center gap-4">
        <Link to={'/login'} className={linkClass}>admin</Link> 
        <Link to={'/credits'} className={linkClass}>credits</Link>
      </div>

      <p>
        <a href={"mailto:" + mail} target="_blank" rel="noreferrer" className={linkClass}>
          {mail}
        </a>
      </p>
    </footer>
  );
}