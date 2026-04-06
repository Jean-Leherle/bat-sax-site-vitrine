import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="text-center text-xs opacity-60 py-6 border-t border-base-300">
      <p>© 2026 batSax — Association L'Alerte — Troyes</p>
      <Link to={'login'}> admin</Link>
      <p><a href="mailto:batsax.music@gmail.com" target="_blank" >batsax.music@gmail.com</a></p>
    </footer>
  );
}