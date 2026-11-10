// Schreibt STORIES.md aus days.js: je Tag jede Story mit Datei, Uhrzeit (Vorschlag), Text
// und dem Sticker, der in Instagram von Hand eingefügt wird. Nicht von Hand ändern: Texte in
// days.js ändern, dann render.cjs und dieses Skript neu ausführen.
//
//   node build_docs.cjs
const fs = require('fs');
const path = require('path');
const { DAYS, TEMPLATES } = require('./days.js');

const pad = (n) => String(n).padStart(2, '0');
const plain = (s) => String(s || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const storiesOf = (d) => d.stories || [{ t: 'fall', ...d.fall }, { t: 'vote', ...d.vote }, { t: 'answer', ...d.answer }, { t: 'drill', ...d.drill }, { t: 'next', ...d.next }];
const TRIAL = 'https://leaderos.de/signup?trial=14';
const link = (medium, n) => `${TRIAL}&utm_source=instagram&utm_medium=${medium}&utm_campaign=wlad-ai&utm_content=d${pad(n)}`;

const TIMES_FIRST = ['07:30', '08:05', '08:05', '08:05', '12:30', '17:30', '17:30', '20:00'];
const TIMES = ['07:30', '07:30', '12:30', '18:00', '18:00'];
const BOOKS = { 'weisse-rhetorik': '„Weiße Rhetorik“', 'die-5-rollen-einer-fuehrungskraft': '„Die 5 Rollen einer Führungskraft“', 'dunkle-rhetorik': '„Dunkle Rhetorik“' };
const NAMES = { alert: 'Ankündigung', reveal: 'Vorstellung', origin: 'Warum es mich gibt', inside: 'Was in mir steckt', fall: 'Fall', vote: 'Abstimmung', answer: 'Antwort', drill: 'Drill', next: 'Weiter', reply: 'Vorlage' };

const text = (s) => {
  if (s.t === 'reveal') return `Hallo. Ich bin WLAD AI. ${plain(s.sub)}`;
  if (s.t === 'origin') return `${plain(s.head)} Foto: Wlad im Coaching. ${s.chips.join(' · ')}. ${s.punch}`;
  if (s.t === 'inside') return `${plain(s.head)} Buchcover: ${s.books.map((b) => BOOKS[b] || b).join(', ')}. ${s.chips.join(' · ')}. ${s.sub}`;
  if (s.t === 'fall') return s.quote ? `${s.who}: „${s.quote}“ ${s.sub}` : `${plain(s.head)} ${s.sub}`;
  if (s.t === 'vote') return `${plain(s.head)}${s.rows ? ' ' + s.rows.map((r, i) => `${'ABC'[i]}: ${r}`).join(' · ') : ''}`;
  if (s.t === 'answer') return [`${s.letter ? s.letter + '. ' : ''}${plain(s.head)}`, s.body, s.bubble ? `„${s.bubble}“` : '', s.prompt ? `Prompt: ${s.prompt}` : '',
    s.list ? s.list.map(([a, b]) => `${a}: ${b}`).join(' ') : '', s.tags ? `${s.tags.join(', ')} (hervorgehoben: ${s.tags[s.on]})` : '',
    s.wrong ? s.wrong.map(([l, t]) => `${l}: ${t}`).join(' ') : '', `${s.whyLabel || 'Prinzip'}: ${s.why}${s.book ? ' (mit Buchcover)' : ''}.`, s.more || ''].filter(Boolean).join(' ');
  if (s.t === 'drill') return `${plain(s.head || 'Dein Satz für heute.')} „${s.tpl}“ ${s.chips.join(' · ')}`;
  if (s.t === 'next') return `${plain(s.head)} ${s.sub}`;
  if (s.t === 'reply') return 'Leere Antwort-Story: Kopfzeile „WLAD AI antwortet“, Platz für die Frage und die Antwort.';
  return plain(s.head);
};
const sticker = (s, d) => {
  const st = s.sticker;
  if (s.t === 'next' && s.kind === 'keyword') return `kein Sticker. Wer mit **WLAD AI** antwortet, bekommt die Nachricht mit dem Link (${link('dm', d.n)})`;
  if (s.t === 'reply') return 'Antwort aus dem Fragen-Sticker einfügen („Antwort teilen“), den Text von WLAD AI in Instagram eintippen';
  if (!st) return 'nichts';
  if (st.kind === 'poll') return `Umfrage „${st.q}“ mit ${st.opts.map((o) => `„${o}“`).join(', ')}`;
  if (st.kind === 'quiz') return `Quiz „${st.q}“ mit ${st.opts.map((o) => `„${o}“`).join(', ')}; richtig: „${st.opts[st.right]}“`;
  if (st.kind === 'question') return `Fragen-Sticker „${st.q}“`;
  if (st.kind === 'link') return `Link-Sticker „${st.q}“ auf ${link('story', d.n)}`;
  if (st.kind === 'post') return `den Feed-Post des Tages (${d.post}) als Sticker teilen`;
  return 'nichts';
};

let md = `# Stories zum Takeover · Tag für Tag

Erzeugt aus \`days.js\` mit \`build_docs.cjs\`. Die Uhrzeiten sind ein Vorschlag (Europe/Berlin), keine
Messwerte. „In Instagram einfügen" heißt: Die Bilddatei lässt an der Stelle Platz, den Sticker setzt
man beim Posten in der App. Wie die Zone aussieht, zeigt die Vorschau in \`_guide/\` (wird beim Rendern
erzeugt, nicht eingecheckt).

`;
for (const d of DAYS) {
  const list = storiesOf(d);
  const times = d.n === 1 ? TIMES_FIRST : TIMES;
  md += `## Tag ${d.n} · ${d.date} · ${d.theme}\n\nFeed-Post um 08:00 Uhr: **${d.post}** · ${d.postTitle}\n\n`;
  md += '| Nr. | Datei | Uhrzeit | Art | Text im Bild | In Instagram einfügen |\n|---|---|---|---|---|---|\n';
  list.forEach((s, i) => {
    md += `| ${i + 1} | \`stories/D${pad(d.n)}-${i + 1}.jpg\` | ${times[i]} | ${NAMES[s.t]} | ${text(s).replace(/\|/g, '/')} | ${sticker(s, d)} |\n`;
  });
  md += '\n';
}
md += `## Vorlagen\n\n| Datei | Wofür |\n|---|---|\n`;
storiesOf(TEMPLATES).forEach((s, i) => { md += `| \`stories/D00-${i + 1}.jpg\` | ${text(s)} ${sticker(s, TEMPLATES)}. |\n`; });
fs.writeFileSync(path.join(__dirname, 'STORIES.md'), md);

// Kalender in PLAN.md zwischen den Marken ersetzen
const STICK = { poll: 'Umfrage', quiz: 'Quiz', question: 'Fragen-Sticker', link: 'Link-Sticker', post: 'Beitrag teilen' };
const NEXT = { ask: 'Frage an WLAD AI', keyword: 'Stichwort', link: 'Link zum Test', post: 'Verweis auf den Post' };
let cal = '| Tag | Datum | Thema | Feed-Post | Stories | Sticker | Story am Schluss |\n|---|---|---|---|---|---|---|\n';
for (const d of DAYS) {
  const list = storiesOf(d);
  const st = [...new Set(list.filter((x) => x.sticker).map((x) => STICK[x.sticker.kind]))].join(', ') || 'keine';
  const last = list[list.length - 1];
  cal += `| ${d.n} | ${d.date} | ${d.theme} | **${d.post}** · ${d.postTitle} | \`D${pad(d.n)}-1\` bis \`D${pad(d.n)}-${list.length}\` | ${st} | ${NEXT[last.kind] || ''} |\n`;
}
const planFile = path.join(__dirname, 'PLAN.md');
const plan = fs.readFileSync(planFile, 'utf8');
const A = '<!-- KALENDER:START -->', B = '<!-- KALENDER:END -->';
if (!plan.includes(A) || !plan.includes(B)) throw new Error('Kalender-Marken fehlen in PLAN.md');
fs.writeFileSync(planFile, plan.slice(0, plan.indexOf(A) + A.length) + '\n' + cal + plan.slice(plan.indexOf(B)));
const n = DAYS.reduce((a, d) => a + storiesOf(d).length, 0);
console.log('STORIES.md geschrieben:', DAYS.length, 'Tage,', n, 'Stories');
