import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Navbar />

    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {children}
      </div>
    </main>

      <Footer />
    </div>
  );
}