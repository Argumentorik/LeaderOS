import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";
import LeaderOSLogo from "./LeaderOSLogo";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentStep = steps.findIndex(s => s.path === location.pathname);
  const isHome = location.pathname === "/";

  return (
    <nav
      data-testid="navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.04]"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          data-testid="navbar-logo"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 group"
        >
          <LeaderOSLogo variant="default" size="md" showTagline />
        </button>

        {/* Desktop Progress Steps */}
        {currentStep >= 0 && !isHome && (
          <div className="hidden lg:flex items-center gap-1" data-testid="navbar-progress">
            {steps.map((step, idx) => (
              <div key={step.path} className="flex items-center gap-1">
                <span
                  className={`font-inter text-xs font-medium transition-colors px-2 py-1 rounded-full ${
                    idx === currentStep
                      ? "text-[#C8FF00] bg-[#C8FF00]/10"
                      : idx < currentStep
                      ? "text-[#C8FF00]/70"
                      : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <ChevronRight className={`w-3 h-3 ${idx < currentStep ? "text-[#C8FF00]/70" : "text-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Desktop CTA */}
        {isHome && (
          <button
            data-testid="navbar-cta"
            onClick={() => navigate("/diagnose")}
            className="hidden md:flex btn-amber text-sm font-medium px-5 py-2.5"
          >
            Diagnose starten
          </button>
        )}

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/[0.04] py-4 px-4">
          {isHome ? (
            <button
              onClick={() => {
                navigate("/diagnose");
                setMobileOpen(false);
              }}
              className="w-full btn-amber py-3 text-sm font-medium"
            >
              Diagnose starten
            </button>
          ) : (
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <button
                  key={step.path}
                  onClick={() => {
                    if (idx <= currentStep) navigate(step.path);
                    setMobileOpen(false);
                  }}
                  disabled={idx > currentStep}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                    idx === currentStep
                      ? "bg-[#C8FF00]/10 text-[#C8FF00]"
                      : idx < currentStep
                      ? "text-[#C8FF00]/70"
                      : "text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <span className="font-inter text-sm">{step.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
