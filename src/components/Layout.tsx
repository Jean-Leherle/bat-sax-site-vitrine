import Navbar from "./Navbar";
import Footer from "./Footer";
import NewsProvider from "../contexts/NewsContext";
import NewsBanner from "./NewsBanner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <NewsProvider>
      <div className="min-h-screen flex flex-col bg-base-100">
        <Navbar />
        <main className="flex-1 flex items-start justify-center px-4 py-2 md:py-12">
          <div className="w-full max-w-4xl">
            {children}
          </div>
        </main>

        <Footer />
        <NewsBanner />
      </div>
    </NewsProvider>
  );
}