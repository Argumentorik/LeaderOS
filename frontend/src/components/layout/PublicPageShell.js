import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WladMark } from '../brand/WladMark';

/**
 * PublicPageShell (Iter 185) — Rahmen für Seiten, die ohne Login erreichbar
 * sind. Befund aus dem Plan: Die Verkaufsseite verlangte einen Login; wer über
 * Suche oder KI-Empfehlung kam, landete auf dem Anmeldeformular und war weg.
 *
 * Iter 189: Am Handy ist die Kopfzeile höher, der Knopf bricht nicht mehr um
 * („Starten" statt „Kostenlos starten"), und jede Fläche ist mit dem Daumen
 * zu treffen.
 */
export const PublicPageShell = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background" data-testid="public-page-shell">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.06] bg-background/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 sm:h-14 flex items-center justify-between gap-2">
          <Link to="/" className="tap-target flex items-center gap-2 py-2 pr-2" data-testid="public-shell-home">
            <WladMark size={22} />
            <span className="font-black text-[15px] sm:text-[14px] tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Leader<span className="opacity-40">·</span>OS
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => navigate('/login')}
                    className="min-h-[44px] text-[13px] sm:text-[12.5px] font-bold px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                    data-testid="public-shell-login">
              Anmelden
            </button>
            <button type="button" onClick={() => navigate('/signup')}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap min-h-[44px] text-[13px] sm:text-[12.5px] font-black px-4 rounded-xl bg-[#BFFF00] text-black"
                    data-testid="public-shell-signup">
              <span className="sm:hidden">Starten</span>
              <span className="hidden sm:inline">Kostenlos starten</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-black/[0.06] dark:border-white/[0.06] mt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-wrap gap-x-6 text-[12px] text-muted-foreground">
          {[['/impressum', 'Impressum'], ['/datenschutz', 'Datenschutz'], ['/agb', 'AGB'],
            ['/widerruf', 'Widerruf'], ['/changelog', 'Was ist neu']].map(([to, label]) => (
            <Link key={to} to={to} className="tap-target py-2 hover:text-foreground">{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default PublicPageShell;
