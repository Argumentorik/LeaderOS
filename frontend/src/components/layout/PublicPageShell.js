import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WladMark } from '../brand/WladMark';

/**
 * PublicPageShell (Iter 185) — Rahmen für Seiten, die ohne Login erreichbar
 * sind. Befund aus dem Plan: Die Verkaufsseite verlangte einen Login; wer über
 * Suche oder KI-Empfehlung kam, landete auf dem Anmeldeformular und war weg.
 */
export const PublicPageShell = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background" data-testid="public-page-shell">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.06] bg-background/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2" data-testid="public-shell-home">
            <WladMark size={22} />
            <span className="font-black text-[14px] tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Leader<span className="opacity-40">·</span>OS
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/login')}
                    className="text-[12.5px] font-bold px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                    data-testid="public-shell-login">
              Anmelden
            </button>
            <button type="button" onClick={() => navigate('/signup')}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-black px-3.5 py-2 rounded-xl bg-[#BFFF00] text-black"
                    data-testid="public-shell-signup">
              Kostenlos starten <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-black/[0.06] dark:border-white/[0.06] mt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
          <Link to="/impressum" className="hover:text-foreground">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
          <Link to="/agb" className="hover:text-foreground">AGB</Link>
          <Link to="/widerruf" className="hover:text-foreground">Widerruf</Link>
          <Link to="/changelog" className="hover:text-foreground">Was ist neu</Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicPageShell;
