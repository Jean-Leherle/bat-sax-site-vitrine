import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const linkClass = (path: string) =>
    `btn btn-sm ${
      pathname === path ? "btn-primary" : "btn-ghost"
    }`;

  return (
    <div className="navbar bg-base-200 border-b border-base-300 px-6">
      <div className="flex-1">
        <Link to="/" className="text-xl neon">
          batSax
        </Link>
      </div>

      <div className="flex gap-2">
        <Link to="/next" className={linkClass("/next")}>
          Next Stage
        </Link>
        <Link to="/saves" className={linkClass("/saves")}>
          Older Saves
        </Link>
      </div>
    </div>
  );
}