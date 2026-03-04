import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import Navbar from "./components/Navbar";
import Hero from "./pages/Hero";
import UserForm from "./pages/UserForm";
import Quiz from "./pages/Quiz";
import Analyzing from "./pages/Analyzing";
import Report from "./pages/Report";
import Roadmap from "./pages/Roadmap";
import HighTicketClose from "./pages/HighTicketClose";
import AICoach from "./components/AICoach";
import { useLocation } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export { API };

function AppContent() {
  const location = useLocation();
  const showCoach = ["/report", "/roadmap", "/close"].includes(location.pathname);

  return (
    <div className="App min-h-screen bg-noir-bg">
      <Navbar />
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/diagnose" element={<UserForm />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/analyzing" element={<Analyzing />} />
        <Route path="/report" element={<Report />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/close" element={<HighTicketClose />} />
      </Routes>
      {showCoach && <AICoach />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
