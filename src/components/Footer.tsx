import { Link } from "react-router-dom";

export default function Footer() {
  const mail = 'contact@batsax.fr'
  return (
    <footer className="text-center text-xs opacity-60 py-6 border-t border-base-300">
      <p>© 2026 batSax — <a href="https://harmonie-alerte.fr/" target="_blank">Association L'Alerte </a> — Troyes</p>
      <Link to={'login'}> admin</Link>
      <p><a href={"mailto:"+mail} target="_blank" >{mail}</a></p>
    </footer>
  );
}