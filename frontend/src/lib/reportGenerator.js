/**
 * Premium Leadership Report Generator — WladBot Leader OS (Iter 92.23.7).
 *
 * What changed vs the previous version:
 *  - Dark-mode magazine layout (Tesla/Apple/Revolut feel) instead of generic
 *    white-paper Bootstrap-ish look.
 *  - LEADER-OS "W"-mark watermark on every page + cover.
 *  - Lime (#BFFF00) accent strip + Outfit display typography for scores.
 *  - Strengths + Improvements promoted to page 1 (matches the in-app order).
 *  - Detailed sub-pages with badged headers and consistent card styling.
 *  - Footer with mission slug + page number.
 */
const BRAND = {
  bg: '#0A0A0A',
  bgSoft: '#111118',
  panel: '#161620',
  panelBright: '#1E1E2A',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.35)',
  lime: '#BFFF00',
  limeDim: 'rgba(191,255,0,0.12)',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  blue: '#60A5FA',
  violet: '#A78BFA',
  pink: '#F472B6',
};

const scoreColor = (s) => {
  if (s >= 80) return BRAND.success;
  if (s >= 60) return BRAND.warning;
  if (s >= 40) return '#FB923C';
  return BRAND.danger;
};

const renderListItem = (text, idx, color) => `
  <div class="list-row">
    <span class="list-num" style="background:${color};color:#0A0A0A">${idx + 1}</span>
    <p class="list-text">${escapeHtml(text)}</p>
  </div>`;

const escapeHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const WLAD_WATERMARK = `
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="9" fill="${BRAND.lime}"/>
    <text x="18" y="24" text-anchor="middle" font-family="Outfit, sans-serif" font-size="20" font-weight="900" fill="#0A0A0A">W</text>
  </svg>`;

const HEADER_BAND = (label) => `
  <div class="band">
    <div class="band-mark">${WLAD_WATERMARK}<span class="band-brand">LEADER<span class="band-dot">·</span>OS</span></div>
    <span class="band-label">${escapeHtml(label)}</span>
  </div>`;

export async function downloadHTMLReport({ title, subtitle, date, analysis, challenge, userName }) {
  const now = new Date();
  const dateStr = date || now.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  const overall = analysis?.overall_score || 0;
  const overallColor = scoreColor(overall);

  // ── PAGE 1 — Cover + 3+3 Stärken/Verbesserungen ────────────────────────
  const page1 = `
    <section class="page page-cover">
      <div class="cover-grain" aria-hidden></div>
      <div class="cover-aurora aurora-1" aria-hidden></div>
      <div class="cover-aurora aurora-2" aria-hidden></div>
      <header class="cover-head">
        <div class="brand-stack">${WLAD_WATERMARK}<div><p class="brand-name">LEADER<span class="brand-dot">·</span>OS</p><p class="brand-sub">Powered by Wlad Jachtchenko</p></div></div>
        <span class="cover-pill">VIDEO MISSION REPORT</span>
      </header>
      <div class="cover-body">
        <p class="cover-eyebrow">${escapeHtml(challenge?.difficulty || 'Mission')} · ${escapeHtml(dateStr)}</p>
        <h1 class="cover-title">${escapeHtml(title)}</h1>
        <p class="cover-sub">${escapeHtml(subtitle || analysis?.wlad_assessment?.slice(0, 110) || '')}</p>
        <div class="cover-score-block">
          <div class="cover-score-ring" style="--ring:${overallColor}">
            <p class="cover-score-num" style="color:${overallColor}">${overall}<span class="cover-score-max">/100</span></p>
            <p class="cover-score-cap">Overall Score</p>
          </div>
          <div class="cover-mini-scores">
            ${[
              { l: 'Klarheit', v: analysis?.clarity_score, c: BRAND.blue },
              { l: 'Selbstvertrauen', v: analysis?.confidence_score, c: BRAND.violet },
              { l: 'Empathie', v: analysis?.empathy_score, c: BRAND.pink },
              { l: 'Struktur', v: analysis?.structure_score, c: BRAND.success },
            ].map(s => `
              <div class="mini-score">
                <p class="mini-score-cap">${s.l}</p>
                <p class="mini-score-num" style="color:${s.c}">${s.v || 0}</p>
                <div class="mini-score-bar"><div style="width:${s.v || 0}%;background:${s.c}"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <footer class="cover-foot">
        <span>${userName ? escapeHtml(userName) : 'Leader'} · ${escapeHtml(dateStr)}</span>
        <span>leaderos.de · Wlad Jachtchenko Methodik</span>
      </footer>
    </section>

    <section class="page">
      ${HEADER_BAND('01 · Stärken & Verbesserungen')}
      <h2 class="page-h2">Was du gut gemacht hast — und was du verbessern kannst.</h2>
      <p class="page-lead">Diese zwei Listen sind dein konkretester Hebel. Stärken bestätigen den Weg, Verbesserungen zeigen den nächsten Schritt.</p>

      <div class="dual-grid">
        <div class="card card-success">
          <div class="card-head">
            <div class="card-badge" style="background:${BRAND.success}26;color:${BRAND.success}">✓</div>
            <div>
              <p class="card-title">3 Dinge, die du gut gemacht hast</p>
              <p class="card-sub">Deine Stärken — bau darauf auf</p>
            </div>
          </div>
          <div class="list-stack">
            ${(analysis?.strengths || []).slice(0,3).map((s, i) => renderListItem(s, i, BRAND.success)).join('')}
          </div>
        </div>
        <div class="card card-warning">
          <div class="card-head">
            <div class="card-badge" style="background:${BRAND.warning}26;color:${BRAND.warning}">→</div>
            <div>
              <p class="card-title">3 Dinge, die du verbessern kannst</p>
              <p class="card-sub">Konkrete Übungen für dein nächstes Mal</p>
            </div>
          </div>
          <div class="list-stack">
            ${(analysis?.improvements || []).slice(0,3).map((s, i) => renderListItem(s, i, BRAND.warning)).join('')}
          </div>
        </div>
      </div>

      ${analysis?.wlad_assessment ? `
        <div class="wlad-quote">
          <div class="wlad-quote-mark">${WLAD_WATERMARK}</div>
          <div>
            <p class="wlad-quote-eyebrow">Wlads persönliche Einschätzung</p>
            <p class="wlad-quote-body">${escapeHtml(analysis.wlad_assessment)}</p>
          </div>
        </div>
      ` : ''}
    </section>`;

  // ── PAGE 2 — Wlads SEXIER-Modell (Fallback: 3 Säulen für Alt-Analysen) ───
  const sexier = analysis?.sexier_scores;
  const page2 = analysis?.framework_feedback || sexier || analysis?.logos_score ? `
    <section class="page">
      ${HEADER_BAND('02 · Wlad-Frameworks')}
      ${sexier ? `
      <h2 class="page-h2">Wlads SEXIER-Modell.</h2>
      <p class="page-lead">Statement · Explanation · eXample · Impact · Explanation of Impact · Rebuttal — die 6 Bausteine eines unwiderstehlichen Arguments.</p>

      <div class="pillar-grid">
        ${[
          { name: 'S · Statement', short: 'Klare These', score: sexier.statement, color: BRAND.warning },
          { name: 'E · Explanation', short: 'Tiefe Begründung', score: sexier.explanation, color: BRAND.pink },
          { name: 'X · eXample', short: 'Konkretes Beispiel', score: sexier.example, color: BRAND.blue },
          { name: 'I · Impact', short: 'Relevanz fürs Gegenüber', score: sexier.impact, color: BRAND.blue },
          { name: 'E · Expl. of Impact', short: 'Warum es wichtig ist', score: sexier.impact_explanation, color: BRAND.violet },
          { name: 'R · Rebuttal', short: 'Einwand entkräftet', score: sexier.rebuttal, color: BRAND.success || BRAND.violet },
        ].map(p => `
          <div class="pillar-card">
            <p class="pillar-name">${p.name}</p>
            <p class="pillar-num" style="color:${scoreColor(p.score || 0)}">${p.score || 0}</p>
            <p class="pillar-cap">${p.short}</p>
            <div class="pillar-bar"><div style="width:${p.score || 0}%;background:${p.color}"></div></div>
          </div>
        `).join('')}
      </div>
      ` : `
      <h2 class="page-h2">3 Säulen der Überzeugung.</h2>
      <p class="page-lead">Aristoteles' Logos · Ethos · Pathos — von Wlad operationalisiert. Jede Säule braucht Aufmerksamkeit.</p>

      <div class="pillar-grid">
        ${[
          { name: 'Logos', short: 'Logik & Daten', score: analysis?.logos_score, color: BRAND.blue },
          { name: 'Ethos', short: 'Glaubwürdigkeit', score: analysis?.ethos_score, color: BRAND.violet },
          { name: 'Pathos', short: 'Emotion', score: analysis?.pathos_score, color: BRAND.pink },
        ].map(p => `
          <div class="pillar-card">
            <p class="pillar-name">${p.name}</p>
            <p class="pillar-num" style="color:${scoreColor(p.score || 0)}">${p.score || 0}</p>
            <p class="pillar-cap">${p.short}</p>
            <div class="pillar-bar"><div style="width:${p.score || 0}%;background:${p.color}"></div></div>
          </div>
        `).join('')}
      </div>
      `}

      ${analysis?.framework_feedback?.sexier ? `
        <div class="quote-card">
          <p class="quote-eyebrow">SEXIER-Analyse</p>
          <p class="quote-body">${escapeHtml(analysis.framework_feedback.sexier)}</p>
        </div>` : ''}
      ${analysis?.framework_feedback?.drei_saeulen ? `
        <div class="quote-card">
          <p class="quote-eyebrow">3-Säulen Analyse</p>
          <p class="quote-body">${escapeHtml(analysis.framework_feedback.drei_saeulen)}</p>
        </div>` : ''}
      ${analysis?.framework_feedback?.kommunikationsquadrant ? `
        <div class="quote-card">
          <p class="quote-eyebrow">Kommunikationsquadrant</p>
          <p class="quote-body">${escapeHtml(analysis.framework_feedback.kommunikationsquadrant)}</p>
        </div>` : ''}
    </section>` : '';

  // ── PAGE 3 — Speech Analysis ────────────────────────────────────────────
  const page3 = analysis?.speech_analysis ? (() => {
    const sa = analysis.speech_analysis;
    return `
      <section class="page">
        ${HEADER_BAND('03 · Sprach-Analyse')}
        <h2 class="page-h2">So hörst du dich an.</h2>
        <p class="page-lead">Tempo, Füllwörter und starke Phrasen — die Signale, die dein Publikum unbewusst lesen.</p>

        <div class="stat-grid">
          <div class="stat-tile"><p class="stat-cap">Füllwörter</p><p class="stat-num" style="color:${BRAND.warning}">${sa.filler_count ?? 0}</p></div>
          <div class="stat-tile"><p class="stat-cap">Satzlänge</p><p class="stat-text">${escapeHtml(sa.avg_sentence_length || '—')}</p></div>
          <div class="stat-tile"><p class="stat-cap">Tempo</p><p class="stat-text">${escapeHtml(sa.speech_pace || '—')}</p></div>
          <div class="stat-tile"><p class="stat-cap">Starke Phrasen</p><p class="stat-num" style="color:${BRAND.success}">${(sa.key_phrases || []).length}</p></div>
        </div>

        ${sa.filler_words?.length ? `
          <div class="chips-row">
            <p class="chips-label">Erkannte Füllwörter</p>
            <div class="chip-stack">${sa.filler_words.map(w => `<span class="chip chip-warn">"${escapeHtml(w)}"</span>`).join('')}</div>
            <p class="chips-tip">Ersetze sie durch bewusste Pausen — eine Pause wirkt souveräner als „ähm".</p>
          </div>` : ''}

        ${sa.key_phrases?.length ? `
          <div class="phrase-card">
            <p class="phrase-eyebrow">Deine stärksten Formulierungen</p>
            ${sa.key_phrases.map(p => `<p class="phrase-line">"${escapeHtml(p)}"</p>`).join('')}
          </div>` : ''}
      </section>`;
  })() : '';

  // ── PAGE 4 — Rewrite + Practice ─────────────────────────────────────────
  const page4 = (analysis?.rewrite_suggestion || analysis?.practice_exercises?.length) ? `
    <section class="page">
      ${HEADER_BAND('04 · Optimierung & Training')}
      <h2 class="page-h2">Wie deine Rede klingen könnte.</h2>
      <p class="page-lead">Ein Rewrite zeigt dir, wie ein C-Level-Skript zur selben Situation aussieht. Plus drei Übungen für die Woche.</p>

      ${analysis?.rewrite_suggestion ? `
        <div class="rewrite-card">
          <p class="rewrite-eyebrow">Wlad-Style Rewrite</p>
          <p class="rewrite-body">"${escapeHtml(analysis.rewrite_suggestion)}"</p>
        </div>` : ''}

      ${analysis?.practice_exercises?.length ? `
        <div class="exercises">
          <p class="exercises-eyebrow">Deine 3 Übungen für morgen</p>
          ${analysis.practice_exercises.slice(0,5).map((e, i) => `
            <div class="exercise-row">
              <span class="exercise-num">${i + 1}</span>
              <p class="exercise-text">${escapeHtml(e)}</p>
            </div>
          `).join('')}
        </div>` : ''}
    </section>` : '';

  // ── PAGE 5 — 7-Tage Plan + Coaching CTA ─────────────────────────────────
  const page5 = `
    <section class="page">
      ${HEADER_BAND('05 · Aktionsplan')}
      <h2 class="page-h2">Dein 7-Tage Entwicklungsplan.</h2>
      <p class="page-lead">Was du diese Woche konkret tust, um beim nächsten Versuch 10–15 Punkte mehr zu holen.</p>

      <div class="plan-stack">
        <div class="plan-row"><span class="plan-day">Tag 1–2</span><p class="plan-text">Wiederhole die Mission mit Fokus auf deine 3 Verbesserungen.</p></div>
        <div class="plan-row"><span class="plan-day">Tag 3–4</span><p class="plan-text">Übe die Rewrite-Version laut vor dem Spiegel — drei Durchläufe.</p></div>
        <div class="plan-row"><span class="plan-day">Tag 5</span><p class="plan-text">Nimm eine neue Aufnahme auf und vergleiche Score-Delta.</p></div>
        <div class="plan-row"><span class="plan-day">Tag 6–7</span><p class="plan-text">Wende das Gelernte in einem echten Gespräch an — Team / Vorstand / Kunde.</p></div>
      </div>

      ${analysis?.improvement_vs_previous && analysis.improvement_vs_previous !== 'null' ? `
        <div class="quote-card">
          <p class="quote-eyebrow">vs. vorherige Versuche</p>
          <p class="quote-body">${escapeHtml(analysis.improvement_vs_previous)}</p>
        </div>` : ''}

      <div class="cta-card">
        <div class="cta-left">
          <p class="cta-eyebrow">BEREIT FÜR 1:1?</p>
          <p class="cta-title">Strategiegespräch mit Wlads Expertenteam</p>
          <p class="cta-sub">15 Min · Unverbindlich · Persönliches Feedback zu deiner Analyse</p>
        </div>
        <span class="cta-link">leaderos.de/coaching</span>
      </div>
    </section>`;

  // ── Compose final HTML ──────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — Leader-OS Mission Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@500;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { background: ${BRAND.bg}; color: ${BRAND.text}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
  .doc { width: 794px; margin: 0 auto; }
  .page { position: relative; padding: 56px 56px 72px; min-height: 1080px; }
  .page + .page { border-top: 1px solid rgba(255,255,255,0.06); }
  .page-h2 { font-family: 'Outfit', sans-serif; font-size: 36px; font-weight: 900; letter-spacing: -0.025em; line-height: 1.08; margin: 12px 0 14px; max-width: 600px; }
  .page-lead { font-size: 14px; color: ${BRAND.textMuted}; max-width: 560px; line-height: 1.6; margin-bottom: 28px; }

  /* Band header */
  .band { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 24px; }
  .band-mark { display:flex; align-items:center; gap: 10px; }
  .band-brand { font-family:'Outfit', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; color: ${BRAND.text}; }
  .band-dot { color: ${BRAND.lime}; padding: 0 1px; }
  .band-label { font-size: 10px; font-weight: 800; letter-spacing: 0.22em; color: ${BRAND.lime}; text-transform: uppercase; }

  /* COVER */
  .page-cover { background: linear-gradient(180deg, #0A0A0A 0%, #0F0F1A 60%, #0A0A0A 100%); overflow: hidden; min-height: 1080px; }
  .cover-grain { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 4px 4px; opacity: 0.6; pointer-events: none; }
  .cover-aurora { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; opacity: 0.5; }
  .aurora-1 { width: 480px; height: 480px; top: -80px; right: -120px; background: ${BRAND.lime}; opacity: 0.18; }
  .aurora-2 { width: 380px; height: 380px; bottom: -120px; left: -120px; background: ${BRAND.violet}; opacity: 0.15; }
  .cover-head { display:flex; justify-content: space-between; align-items: center; position: relative; }
  .brand-stack { display: flex; align-items: center; gap: 12px; }
  .brand-name { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 0.12em; color: ${BRAND.text}; }
  .brand-dot { color: ${BRAND.lime}; }
  .brand-sub { font-size: 10px; color: ${BRAND.textDim}; letter-spacing: 0.1em; }
  .cover-pill { display: inline-flex; padding: 6px 14px; border-radius: 999px; background: ${BRAND.lime}; color: #0A0A0A; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; }
  .cover-body { margin-top: 130px; position: relative; }
  .cover-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: ${BRAND.lime}; margin-bottom: 16px; }
  .cover-title { font-family: 'Outfit', sans-serif; font-size: 52px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.02; max-width: 620px; }
  .cover-sub { font-size: 16px; color: ${BRAND.textMuted}; margin: 18px 0 56px; max-width: 540px; line-height: 1.55; }
  .cover-score-block { display: flex; gap: 36px; align-items: center; }
  .cover-score-ring { width: 200px; height: 200px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 4px solid var(--ring); position: relative; box-shadow: 0 0 60px rgba(191,255,0,0.18); background: rgba(0,0,0,0.4); }
  .cover-score-num { font-family: 'Outfit', sans-serif; font-size: 76px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; }
  .cover-score-max { font-size: 22px; font-weight: 700; color: ${BRAND.textDim}; }
  .cover-score-cap { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: ${BRAND.textMuted}; font-weight: 800; margin-top: 4px; }
  .cover-mini-scores { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1; }
  .mini-score { padding: 12px 14px; border-radius: 12px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.06); }
  .mini-score-cap { font-size: 9px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${BRAND.textMuted}; }
  .mini-score-num { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 900; line-height: 1; margin-top: 6px; }
  .mini-score-bar { height: 3px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .mini-score-bar > div { height: 100%; border-radius: 2px; }
  .cover-foot { position: absolute; left: 56px; right: 56px; bottom: 40px; display: flex; justify-content: space-between; font-size: 10px; color: ${BRAND.textDim}; letter-spacing: 0.06em; }

  /* DUAL GRID (3+3) */
  .dual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .card { border-radius: 16px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.06); padding: 20px; }
  .card-success { border-left: 3px solid ${BRAND.success}; }
  .card-warning { border-left: 3px solid ${BRAND.warning}; }
  .card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .card-badge { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; }
  .card-title { font-family:'Outfit', sans-serif; font-size: 14px; font-weight: 800; }
  .card-sub { font-size: 10px; color: ${BRAND.textMuted}; }
  .list-stack { display: flex; flex-direction: column; gap: 10px; }
  .list-row { display: flex; gap: 12px; padding: 12px 14px; border-radius: 12px; background: ${BRAND.panelBright}; border: 1px solid rgba(255,255,255,0.04); }
  .list-num { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; flex-shrink: 0; }
  .list-text { font-size: 12.5px; line-height: 1.55; color: ${BRAND.text}; }

  /* WLAD QUOTE */
  .wlad-quote { display: flex; gap: 16px; padding: 20px; border-radius: 16px; background: linear-gradient(135deg, ${BRAND.panel}, ${BRAND.bgSoft}); border: 1px solid ${BRAND.limeDim}; margin-top: 22px; }
  .wlad-quote-mark { flex-shrink: 0; }
  .wlad-quote-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.22em; color: ${BRAND.lime}; text-transform: uppercase; margin-bottom: 8px; }
  .wlad-quote-body { font-size: 13px; line-height: 1.6; color: ${BRAND.text}; }

  /* PILLAR */
  .pillar-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 24px; }
  .pillar-card { padding: 22px 16px; border-radius: 14px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.05); text-align: center; }
  .pillar-name { font-family:'Outfit', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; }
  .pillar-num { font-family:'Outfit', sans-serif; font-size: 46px; font-weight: 900; line-height: 1; letter-spacing: -0.02em; margin: 8px 0 2px; }
  .pillar-cap { font-size: 10px; color: ${BRAND.textMuted}; margin-bottom: 10px; }
  .pillar-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
  .pillar-bar > div { height: 100%; border-radius: 2px; }

  /* QUOTE CARD */
  .quote-card { padding: 18px 20px; border-radius: 12px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.04); border-left: 3px solid ${BRAND.lime}; margin-bottom: 12px; }
  .quote-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.22em; color: ${BRAND.lime}; text-transform: uppercase; margin-bottom: 6px; }
  .quote-body { font-size: 12.5px; line-height: 1.6; color: ${BRAND.textMuted}; }

  /* STAT */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-tile { padding: 16px; border-radius: 12px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.05); text-align: center; }
  .stat-cap { font-size: 9px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${BRAND.textMuted}; }
  .stat-num { font-family:'Outfit', sans-serif; font-size: 32px; font-weight: 900; line-height: 1; margin-top: 6px; }
  .stat-text { font-size: 14px; font-weight: 700; line-height: 1; margin-top: 10px; }

  .chips-row { margin-bottom: 20px; }
  .chips-label { font-size: 10px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: ${BRAND.textMuted}; margin-bottom: 10px; }
  .chip-stack { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .chip { font-size: 11px; padding: 4px 10px; border-radius: 999px; font-weight: 600; }
  .chip-warn { background: rgba(251,191,36,0.12); color: ${BRAND.warning}; }
  .chips-tip { font-size: 11px; color: ${BRAND.warning}; font-weight: 600; }

  .phrase-card { padding: 18px 20px; border-radius: 12px; background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.18); }
  .phrase-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.18em; color: ${BRAND.success}; text-transform: uppercase; margin-bottom: 8px; }
  .phrase-line { font-size: 12.5px; font-style: italic; color: ${BRAND.text}; padding: 5px 0; border-left: 2px solid rgba(74,222,128,0.4); padding-left: 12px; margin-bottom: 4px; }

  /* REWRITE + EXERCISES */
  .rewrite-card { padding: 22px; border-radius: 16px; background: linear-gradient(135deg, rgba(96,165,250,0.06), rgba(191,255,0,0.04)); border: 1px solid rgba(96,165,250,0.15); margin-bottom: 22px; }
  .rewrite-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.22em; color: ${BRAND.blue}; text-transform: uppercase; margin-bottom: 10px; }
  .rewrite-body { font-size: 14px; line-height: 1.65; color: ${BRAND.text}; font-style: italic; }

  .exercises { padding: 22px; border-radius: 16px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.05); }
  .exercises-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.22em; color: ${BRAND.lime}; text-transform: uppercase; margin-bottom: 14px; }
  .exercise-row { display: flex; gap: 14px; padding: 11px 0; border-top: 1px solid rgba(255,255,255,0.04); align-items: flex-start; }
  .exercise-row:first-of-type { border-top: 0; padding-top: 0; }
  .exercise-num { width: 26px; height: 26px; border-radius: 8px; background: ${BRAND.lime}; color: #0A0A0A; font-weight: 900; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
  .exercise-text { font-size: 13px; line-height: 1.55; }

  /* PLAN */
  .plan-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .plan-row { display: flex; gap: 18px; padding: 14px 16px; border-radius: 12px; background: ${BRAND.panel}; border: 1px solid rgba(255,255,255,0.05); align-items: center; }
  .plan-day { font-family:'Outfit', sans-serif; font-size: 11px; font-weight: 900; color: ${BRAND.lime}; letter-spacing: 0.1em; min-width: 64px; }
  .plan-text { font-size: 12.5px; color: ${BRAND.text}; line-height: 1.55; }

  /* CTA */
  .cta-card { display: flex; justify-content: space-between; align-items: center; padding: 26px 28px; border-radius: 18px; background: linear-gradient(135deg, ${BRAND.lime}, #9ACC00); color: #0A0A0A; margin-top: 30px; }
  .cta-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.22em; }
  .cta-title { font-family:'Outfit', sans-serif; font-size: 22px; font-weight: 900; margin: 6px 0 4px; letter-spacing: -0.01em; }
  .cta-sub { font-size: 12px; opacity: 0.7; }
  .cta-link { font-family:'Outfit', sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 0.04em; }

  @page { margin: 0; size: A4; }
  @media print { .page { page-break-after: always; } }
</style>
</head>
<body>
<div class="doc">
  ${page1}
  ${page2}
  ${page3}
  ${page4}
  ${page5}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
  const dateSuffix = now.toISOString().split('T')[0];
  return generatePDFFromHTML(html, `LeaderOS_Report_${safeTitle}_${dateSuffix}.pdf`, blob);
}

async function generatePDFFromHTML(html, filename, fallbackBlob) {
  let iframe;
  try {
    const [{ jsPDF }, html2canvasMod] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = html2canvasMod.default || html2canvasMod;

    iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:auto;border:0;visibility:hidden;';
    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    await new Promise((resolve) => {
      const onLoad = () => { iframe.removeEventListener('load', onLoad); resolve(); };
      iframe.addEventListener('load', onLoad);
      setTimeout(resolve, 1800);
    });
    await new Promise((r) => setTimeout(r, 300));

    const target = iframe.contentDocument.querySelector('.doc') || iframe.contentDocument.body;
    const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#0A0A0A' });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(filename);
    return true;
  } catch (e) {
    console.error('PDF generation failed, falling back to HTML download:', e);
    if (fallbackBlob) {
      const url = URL.createObjectURL(fallbackBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.pdf$/i, '.html');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return false;
  } finally {
    if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
  }
}

export { generatePDFFromHTML };
