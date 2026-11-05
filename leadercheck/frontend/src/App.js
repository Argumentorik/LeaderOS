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

const ROUTE_META = {
  "/": {
    title: "Leader-Check · Kostenlose KI-Leadership-Diagnose in 5 Minuten | Leader OS",
    description: "Kostenlose KI-Diagnose für Führungskräfte: 20 Fragen · 5 Min · personalisierter Report mit 30-Tage-Aktionsplan. Wlad Jachtchenkos Methodik live. DSGVO-konform.",
  },
  "/diagnose": {
    title: "Diagnose starten · Leader-Check",
    description: "Starte deine kostenlose Leadership-Diagnose. Name + E-Mail eintragen, in 5 Minuten zum personalisierten KI-Report.",
  },
  "/quiz": {
    title: "20 Fragen · Leadership-Diagnose | Leader-Check",
    description: "Beantworte 20 Fragen zu KI, Rhetorik und EQ. Auto-Save aktiv — du kannst jederzeit pausieren und fortsetzen.",
  },
  "/report": {
    title: "Dein Leadership-Report · Leader-Check",
    description: "Dein personalisierter KI-Report: 6 Führungsrollen, Stärken, Lücken und konkrete Hebel.",
  },
  "/roadmap": {
    title: "Dein 30-Tage-Aktionsplan · Leader-Check",
    description: "Personalisierter 30-Tage-Plan basierend auf deiner Leadership-Diagnose.",
  },
  "/close": {
    title: "Leader OS Programme · Sprint · Plus-Plus · Enterprise",
    description: "Wlads Programme: Sprint (997 €), Plus-Plus (4.797 €) oder Enterprise. 14 Tage Geld-zurück · ohne Diskussion.",
  },
  "/kurse": {
    title: "Wlad's Methodik · 91 Lektionen | Leader OS",
    description: "11 Frameworks, 91 Lektionen, WladBot 24/7. Die Methodik hinter Leader-Check.",
  },
  "/activate": {
    title: "License Key aktivieren · Leader-Check",
    description: "Aktiviere deinen License Key und starte mit Leader OS.",
  },
  "/login": {
    title: "Login · Leader-Check",
    description: "Einloggen bei Leader-Check via E-Mail oder Telefon.",
  },
  "/payment-success": {
    title: "Zahlung erfolgreich · Leader OS",
    description: "Willkommen bei Leader OS.",
  },
};

function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = ROUTE_META[pathname] || ROUTE_META["/"];
    document.title = meta.title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", meta.description);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://leadercheck.de${pathname === "/" ? "/" : pathname}`);

    // OG title/description sync
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", meta.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", meta.description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", `https://leadercheck.de${pathname === "/" ? "/" : pathname}`);

    // Twitter sync
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", meta.title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", meta.description);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const showCoach = ["/report", "/roadmap", "/close"].includes(location.pathname);

  return (
    <div className="App min-h-screen bg-[#0a0a0a]">
      <ScrollToTop />
      <RouteMeta />
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
