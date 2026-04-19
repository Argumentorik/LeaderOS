import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./pages/Hero";
import UserForm from "./pages/UserForm";
import Quiz from "./pages/Quiz";
import Analyzing from "./pages/Analyzing";
import Report from "./pages/Report";
import Roadmap from "./pages/Roadmap";
import HighTicketClose from "./pages/HighTicketClose";
import PaymentSuccess from "./pages/PaymentSuccess";
import ActivateKey from "./pages/ActivateKey";
import Admin from "./pages/Admin";
import Kurse from "./pages/Kurse";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import AICoach from "./components/AICoach";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export { API };

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const showCoach = ["/report", "/roadmap", "/close"].includes(location.pathname);

  return (
    <div className="App min-h-screen bg-[#0a0a0a]">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/diagnose" element={<UserForm />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/analyzing" element={<Analyzing />} />
        <Route path="/report" element={<Report />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/close" element={<HighTicketClose />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/activate" element={<ActivateKey />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/kurse" element={<Kurse />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
