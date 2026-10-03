import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Building, Plus, Info, X } from 'lucide-react';
import { WladBotAvatar } from '../brand/WladBotAvatar';
const ContextPanel = ({ userContext, setUserContext, de, aboutMe, onClose }) => {
  const filled = ['role', 'company', 'industry'].filter(k => (userContext[k] || '').trim()).length;
  return (
    <div className="mt-4 mb-3 rounded-2xl border border-[#BFFF00]/25 bg-[#BFFF00]/[0.04] p-4 space-y-3 animate-fade-in" data-testid="context-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-black">{de ? 'Dein Kontext' : 'Your context'}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
            {de
              ? 'Ohne diese drei Angaben antwortet WladBot allgemein. Mit ihnen rechnet er mit deiner Rolle, deinem Unternehmen und deiner Branche.'
              : 'Without these three, WladBot answers generically. With them it reasons about your role, company and industry.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
            filled === 3 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                         : 'bg-amber-500/15 text-amber-600'}`} data-testid="context-progress">
            {filled}/3
          </span>
          {/* Iter 139: auf Mobile war das Panel nicht schließbar (Header-Button
              lag außerhalb des Sichtbereichs) — eigener Close-Button im Panel. */}
          <button
            type="button"
            onClick={onClose}
            aria-label={de ? 'Kontext schließen' : 'Close context'}
            data-testid="context-panel-close"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input value={userContext.role} onChange={e => setUserContext(p => ({ ...p, role: e.target.value }))}
          placeholder={de ? 'Rolle * (z.B. Team Lead)' : 'Role * (e.g. team lead)'}
          className={`h-9 text-xs ${!userContext.role?.trim() ? 'border-amber-500/50' : ''}`} data-testid="context-role" />
        <Input value={userContext.company} onChange={e => setUserContext(p => ({ ...p, company: e.target.value }))}
          placeholder={de ? 'Unternehmen *' : 'Company *'}
          className={`h-9 text-xs ${!userContext.company?.trim() ? 'border-amber-500/50' : ''}`} data-testid="context-company" />
        <Input value={userContext.industry} onChange={e => setUserContext(p => ({ ...p, industry: e.target.value }))}
          placeholder={de ? 'Branche *' : 'Industry *'}
          className={`h-9 text-xs ${!userContext.industry?.trim() ? 'border-amber-500/50' : ''}`} data-testid="context-industry" />
      </div>

      {/* Über mich — der eigentliche Hebel für persönliches Feedback */}
      <div className="rounded-xl bg-white/70 dark:bg-card/60 border border-black/[0.06] dark:border-white/[0.08] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-black">{de ? 'Über mich' : 'About me'}</p>
          {aboutMe ? (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" data-testid="about-me-status-filled">
              {de ? 'aktiv' : 'active'}
            </span>
          ) : (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600" data-testid="about-me-status-empty">
              {de ? 'fehlt noch' : 'missing'}
            </span>
          )}
        </div>
        <p className="text-[10.5px] text-muted-foreground leading-relaxed mt-1">
          {aboutMe
            ? (de ? 'WladBot kennt deine Stärken, Baustellen, Ziele und dein Umfeld und bezieht sich in jeder Antwort darauf.'
                  : 'WladBot knows your strengths, blockers, goals and environment and refers to them in every answer.')
            : (de ? 'Hier trägst du frei ein, was zu dir gehört: Persönlichkeit, Stärken, Schwächen, Erfahrungen, Kompetenzen, Vorlieben, Umfeld, Beruf, Verantwortung, Ziele. Der Text darf sich jederzeit ändern — WladBot nutzt immer die aktuelle Version.'
                  : 'Write freely about yourself: personality, strengths, weaknesses, experience, skills, preferences, environment, job, responsibility, goals. Edit it anytime — WladBot always uses the latest version.')}
        </p>
        <a href="/profile" className="tap-target inline-flex items-center gap-1 mt-1 py-2 text-[11px] font-bold text-[#4A6200] dark:text-[#BFFF00] hover:underline" data-testid="about-me-link">
          {aboutMe ? (de ? 'Über mich bearbeiten' : 'Edit about me') : (de ? 'Jetzt „Über mich" ausfüllen' : 'Fill in "About me" now')} →
        </a>
      </div>

      {/* Kontext-Ordner erklaert */}
      <details className="group" data-testid="context-folders-info">
        <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-muted-foreground hover:text-foreground list-none">
          <Info size={12} /> {de ? 'Wie nutze ich Kontext-Ordner richtig?' : 'How do I use context folders?'}
        </summary>
        <ul className="mt-2 space-y-1.5 pl-1">
          {(de ? [
            'Ein Ordner = ein Thema, nicht ein Tag. Zum Beispiel „Gehaltsgespräch Müller" oder „Reorg Vertrieb".',
            'Alles, was du in diesem Ordner besprichst, hochlädst oder als Strategie speicherst, bleibt zusammen — WladBot kennt die Vorgeschichte beim nächsten Mal.',
            'Vor einem wichtigen Gespräch: Ordner öffnen, Dokument hochladen, dann fragen. Die Antwort bezieht sich dann auf euren konkreten Fall.',
            'Themen nicht mischen. Zwei Konflikte in einem Ordner machen die Antworten unscharf.',
            'Erledigt? Ordner archivieren statt löschen — die Historie bleibt dir erhalten.',
          ] : [
            'One folder = one topic, not a tag. E.g. "Salary talk Müller" or "Sales reorg".',
            'Everything you discuss, upload or save in that folder stays together — WladBot knows the history next time.',
            'Before an important conversation: open the folder, upload the document, then ask.',
            'Do not mix topics. Two conflicts in one folder blur the answers.',
            'Done? Archive the folder instead of deleting it — the history stays.',
          ]).map(t => (
            <li key={t} className="text-[10.5px] text-muted-foreground leading-relaxed flex gap-1.5">
              <span className="text-[#BFFF00] shrink-0">·</span>{t}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};

export const ChatRolesHeader = ({
  showContext, setShowContext, userContext, setUserContext, aboutMe,
  onNewSession, lang, de,
}) => {
  // lang is kept in the signature for future i18n hooks but not consumed here.
  void lang;
  return (
    <div className="border-b border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-card/80 backdrop-blur-xl">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WladBotAvatar size={38} live />
            <div>
              <h2 className="text-lg font-black">WladBot</h2>
              <p className="text-[11px] text-muted-foreground font-medium">{de ? 'Dein KI Leadership Coach' : 'Your AI Leadership Coach'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowContext(!showContext)}
              className={`text-xs font-semibold h-8 border-black/10 dark:border-white/10 ${showContext ? 'bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/10 border-[#BFFF00]/30' : ''}`}
              data-testid="context-toggle-btn">
              <Building size={12} className="mr-1" /> {de ? 'Kontext' : 'Context'}
            </Button>
            <Button variant="outline" size="sm" onClick={onNewSession} className="text-xs font-semibold h-8 border-black/10 dark:border-white/10" data-testid="new-chat-session-btn">
              <Plus size={12} className="mr-1" /> {de ? 'Neuer Chat' : 'New Chat'}
            </Button>
          </div>
        </div>

        {showContext && <ContextPanel userContext={userContext} setUserContext={setUserContext} de={de} aboutMe={aboutMe} onClose={() => setShowContext(false)} />}
      </div>
    </div>
  );
};
