import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const steps = [
  { path: "/diagnose", label: "Profil" },
  { path: "/quiz", label: "Diagnose" },
  { path: "/analyzing", label: "Analyse" },
  { path: "/report", label: "Report" },
  { path: "/roadmap", label: "Fahrplan" },
  { path: "/close", label: "Upgrade" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = steps.findIndex(s => s.path === location.pathname);

  return (
    <nav
      data-testid="navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          data-testid="navbar-logo"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group"
        >
          <span className="font-manrope font-black text-lg tracking-widest text-white group-hover:text-blue-400 transition-colors">
            EMERGENT
          </span>
          <span className="font-manrope font-medium text-xs tracking-[0.3em] text-warm-DEFAULT hidden sm:block">
            DIAGNOSTIC HUB
          </span>
        </button>

        {/* Progress Steps */}
        {currentStep >= 0 && (
          <div className="hidden md:flex items-center gap-1" data-testid="navbar-progress">
            {steps.map((step, idx) => (
              <div key={step.path} className="flex items-center gap-1">
                <span
                  className={`font-manrope text-xs font-medium tracking-wider uppercase transition-colors ${
                    idx === currentStep
                      ? "text-white"
                      : idx < currentStep
                      ? "text-blue-400"
                      : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <ChevronRight className={`w-3 h-3 ${idx < currentStep ? "text-blue-400" : "text-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {location.pathname === "/" && (
          <button
            data-testid="navbar-cta"
            onClick={() => navigate("/diagnose")}
            className="btn-primary text-xs font-manrope tracking-widest uppercase px-5 py-2"
          >
            Diagnose starten
          </button>
        )}
      </div>
    </nav>
  );
}
