export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center flex-col gap-6">
      <h1 className="neon text-xl">batSax</h1>
      <div className="loading loading-bars loading-lg text-primary"></div>
      <p className="text-xs animate-pulse">Chargement des Shaders...</p>
    </div>
  );
}