import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby";
import NextStage from "./pages/NextStage";
import Saves from "./pages/Saves";
import Cursor from "./components/Cursor";
import Layout from "./components/Layout";
import Credits from "./pages/Credits";

export default function App() {
  return (
    <BrowserRouter>
      <Cursor />
      <Layout>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/next" element={<NextStage />} />
          <Route path="/saves" element={<Saves />} />
          <Route path="/credits" element={<Credits />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}