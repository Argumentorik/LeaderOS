import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { readConsent, writeConsent, hasConsent } from '../../lib/consent';

const ACCEPT_ALL = { analytics: true, replays: true };
const ESSENTIAL_ONLY = { analytics: false, replays: false };

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState(() => readConsent() || ESSENTIAL_ONLY);

  useEffect(() => {
    // Show banner if no consent recorded yet
    if (!hasConsent()) setVisible(true);

    // Allow other components to open the settings modal
    const openHandler = () => {
      setDraft(readConsent() || ESSENTIAL_ONLY);
      setCustomizing(true);
      setVisible(true);
    };
    window.addEventListener('open-cookie-settings', openHandler);
    return () => window.removeEventListener('open-cookie-settings', openHandler);
  }, []);

  const accept = useCallback((choice) => {
    writeConsent(choice);
    setVisible(false);
    setCustomizing(false);
  }, []);

  if (!visible) return null;

  if (customizing) {
    return (
      <CookieSettingsModal
        draft={draft}
        setDraft={setDraft}
        onSave={() => accept(draft)}
        onCancel={() => setCustomizing(false)}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie-Hinweis"
      className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-2xl mx-auto bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur">
        <h2 className="text-white text-base font-semibold mb-2">
          Wir achten auf deine Daten
        </h2>
        <p className="text-white/70 text-sm leading-relaxed">
          Wir nutzen technisch notwendige Cookies (z. B. für Login). Für
          Analyse und zur Verbesserung der Plattform setzen wir – nur mit
          deiner Einwilligung – PostHog (EU) und Sentry Session Replays ein.
          Du kannst die Einwilligung jederzeit in den Cookie-Einstellungen
          widerrufen.{' '}
          <Link to="/datenschutz" className="underline hover:text-[#BFFF00]">
            Mehr in der Datenschutzerklärung
          </Link>
          .
        </p>

        <div className="flex flex-col md:flex-row gap-2 mt-5">
          <button
            onClick={() => accept(ACCEPT_ALL)}
            className="flex-1 h-11 rounded-xl bg-[#BFFF00] text-black font-semibold text-sm hover:bg-[#DFFF66] transition-colors"
            data-testid="cookie-accept-all"
          >
            Alle akzeptieren
          </button>
          <button
            onClick={() => accept(ESSENTIAL_ONLY)}
            className="flex-1 h-11 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm hover:bg-white/[0.1] transition-colors"
            data-testid="cookie-essential-only"
          >
            Nur essenziell
          </button>
          <button
            onClick={() => setCustomizing(true)}
            className="flex-1 h-11 rounded-xl text-white/60 text-sm hover:text-white transition-colors"
            data-testid="cookie-customize"
          >
            Einstellungen
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieSettingsModal({ draft, setDraft, onSave, onCancel }) {
  return (
    <div
      role="dialog"
      aria-label="Cookie-Einstellungen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-white text-lg font-semibold mb-1">Cookie-Einstellungen</h2>
        <p className="text-white/60 text-xs">
          Wähle, welche Kategorien aktiv sein sollen.
        </p>

        <div className="mt-6 space-y-3">
          <SettingRow
            title="Essenzielle Cookies"
            description="Notwendig für Login, Sicherheit und Grundfunktionen. Können nicht deaktiviert werden."
            checked
            disabled
          />
          <SettingRow
            title="Analyse (PostHog EU)"
            description="Anonymisierte Nutzungsstatistiken und Session Recordings, um die Plattform zu verbessern. Eingaben werden maskiert."
            checked={draft.analytics}
            onChange={(v) => setDraft({ ...draft, analytics: v })}
          />
          <SettingRow
            title="Fehler-Replays (Sentry)"
            description="Nur bei Fehlern. Hilft uns, kritische Bugs zu reproduzieren. Texte werden maskiert."
            checked={draft.replays}
            onChange={(v) => setDraft({ ...draft, replays: v })}
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onSave}
            className="flex-1 h-11 rounded-xl bg-[#BFFF00] text-black font-semibold text-sm hover:bg-[#DFFF66] transition-colors"
            data-testid="cookie-save"
          >
            Speichern
          </button>
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm hover:bg-white/[0.1] transition-colors"
          >
            Abbrechen
          </button>
        </div>

        <p className="text-[11px] text-white/40 mt-4 leading-relaxed">
          Siehe auch unsere{' '}
          <Link to="/datenschutz" className="underline hover:text-white" onClick={onCancel}>
            Datenschutzerklärung
          </Link>
          {' '}und das{' '}
          <Link to="/impressum" className="underline hover:text-white" onClick={onCancel}>
            Impressum
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function SettingRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="flex gap-4 items-start p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex-1">
        <div className="text-white text-sm font-medium">{title}</div>
        <div className="text-white/50 text-xs leading-relaxed">{description}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer pt-1">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={!!checked}
          onChange={(e) => onChange && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#BFFF00]' : 'bg-white/10'
        } ${disabled ? 'opacity-40' : ''}`}>
          <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </div>
      </label>
    </div>
  );
}
