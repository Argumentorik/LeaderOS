import { Link } from 'react-router-dom';

export default function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Zurück
          </Link>
          <div className="text-sm font-medium tracking-wide">LeaderOS</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <article className="legal-prose space-y-6 text-white/80 leading-relaxed">
          {children}
        </article>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 mt-12">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 text-xs text-white/40">
          <Link to="/impressum" className="hover:text-white">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-white">Datenschutz</Link>
          <Link to="/agb" className="hover:text-white">AGB</Link>
          <Link to="/widerruf" className="hover:text-white">Widerruf</Link>
          <button
            onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
            className="hover:text-white"
          >
            Cookie-Einstellungen
          </button>
        </div>
      </footer>

      <style>{`
        .legal-prose h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .legal-prose h3 {
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .legal-prose p {
          margin-bottom: 1rem;
        }
        .legal-prose ul, .legal-prose ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .legal-prose ul { list-style-type: disc; }
        .legal-prose ol { list-style-type: decimal; }
        .legal-prose li {
          margin-bottom: 0.4rem;
        }
        .legal-prose a {
          color: #BFFF00;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .legal-prose a:hover {
          color: #DFFF66;
        }
        .legal-prose section {
          padding-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
