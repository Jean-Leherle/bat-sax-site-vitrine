import { useEffect, useRef } from "react";

export default function Cursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const trail = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajuster la taille du canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    resize();

    // Boucle d'animation (plus performant que useEffect pour le dessin)
    let animationId: number;
    const render = () => {
      // Effet d'interpolation (la traînée rattrape doucement la souris)
      trail.current.x += (mouse.current.x - trail.current.x) * 0.3;
      trail.current.y += (mouse.current.y - trail.current.y) * 0.3;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Dessin de la traînée (le lien) ---
      ctx.beginPath();
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(0, 255, 204, 0.3)";
      
      // On trace une ligne entre la souris et la traînée
      ctx.moveTo(mouse.current.x, mouse.current.y);
      ctx.lineTo(trail.current.x, trail.current.y);
      ctx.stroke();

      // --- Dessin du point principal (le glow) ---
      ctx.beginPath();
      ctx.arc(mouse.current.x, mouse.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#00ffcc";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00ffcc";
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}