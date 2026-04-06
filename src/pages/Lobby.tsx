import { Link } from "react-router-dom";
export default function Lobby() {
  return (
    <div className="text-center flex flex-col items-center gap-8">
      <h1 className="text-4xl neon">batSax</h1>

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
  );
}