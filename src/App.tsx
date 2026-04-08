import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby";
import Stages from "./pages/Stages";
import Admin from "./pages/Admin";
import Login from "./pages/Login"; 
import Cursor from "./components/Cursor";
import Layout from "./components/Layout";
import Credits from "./pages/Credits";
import NotFound from "./pages/NotFound";
import { AudioProvider } from "./contexts/AudioContext";

export default function App() {
  return (
    <BrowserRouter>
    <AudioProvider>
      <Cursor />
      <Layout>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/next" element={<Stages mode="upcoming" />} />
          <Route path="/saves" element={<Stages mode="past" />} />
          <Route path="/credits" element={<Credits/>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </AudioProvider>
    </BrowserRouter>
  );
}