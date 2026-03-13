import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('wladhub_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}
    localStorage.removeItem('wladhub_user');
    localStorage.removeItem('emergent_user');
    setUser(null);
    navigate('/');
  };

  const currentStep = steps.findIndex(s => s.path === location.pathname);
  const isHome = location.pathname === "/";

  return (
    <nav
      data-testid="navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          data-testid="navbar-logo"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 group"
        >
          <span className="font-manrope font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-orange-400 transition-all">
            WLADHUB
          </span>
          <span className="hidden sm:block h-4 w-px bg-white/10" />
          <span className="font-inter text-sm text-slate-500 hidden sm:block">
            Leadership Diagnose
          </span>
        </button>

        {/* Desktop Progress Steps */}
        {currentStep >= 0 && !isHome && (
          <div className="hidden lg:flex items-center gap-1" data-testid="navbar-progress">
            {steps.map((step, idx) => (
              <div key={step.path} className="flex items-center gap-1">
                <span
                  className={`font-inter text-xs font-medium transition-colors px-2 py-1 rounded-full ${
                    idx === currentStep
                      ? "text-amber-400 bg-amber-500/10"
                      : idx < currentStep
                      ? "text-amber-500"
                      : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <ChevronRight className={`w-3 h-3 ${idx < currentStep ? "text-amber-500" : "text-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Right side: User/Login + CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-inter text-sm text-slate-400">{user.name?.split(' ')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span className="font-inter text-sm">Anmelden</span>
            </button>
          )}

          {/* Desktop CTA */}
          {isHome && (
            <button
              data-testid="navbar-cta"
              onClick={() => navigate("/login")}
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
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/5 py-4 px-4">
          {user && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
              {user.picture && <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />}
              <div>
                <p className="font-inter text-sm text-white">{user.name}</p>
                <button
                  onClick={handleLogout}
                  className="font-inter text-xs text-slate-500 hover:text-red-400"
                >
                  Abmelden
                </button>
              </div>
            </div>
          )}

          {isHome ? (
            <button
              onClick={() => {
                navigate("/login");
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
                      ? "bg-amber-500/10 text-amber-400"
                      : idx < currentStep
                      ? "text-amber-500"
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
