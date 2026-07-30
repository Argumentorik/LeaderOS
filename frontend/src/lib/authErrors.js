// Parse FastAPI/Pydantic error responses into a single user-friendly string.
// Pydantic v2 returns `detail: [{loc, msg, type, ...}]` for 422 validation errors.
// Plain HTTPException returns `detail: "string"`.
//
// Iter 124.4 (Godmode pre-launch): translate known backend English tokens to
// German so the UI stays in the user's language even on server errors.

const EN_TO_DE = {
  'Invalid credentials':          'E-Mail oder Passwort ist falsch.',
  'User not found':               'Kein Konto mit dieser E-Mail gefunden.',
  'Email already registered':     'Diese E-Mail ist bereits registriert.',
  'Phone already registered':     'Diese Telefonnummer ist bereits registriert.',
  'Invalid or expired token':     'Der Link ist ungültig oder abgelaufen.',
  'Token expired':                'Der Link ist abgelaufen. Bitte neuen Link anfordern.',
  'Rate limit exceeded':          'Zu viele Versuche. Bitte in ein paar Minuten erneut probieren.',
  'Too many attempts':            'Zu viele Fehlversuche. Bitte kurz warten.',
  'Account locked':               'Dein Konto wurde temporär gesperrt. Bitte in 15 Minuten erneut versuchen.',
  'Password too short':           'Passwort ist zu kurz (min. 8 Zeichen).',
  'Password too weak':            'Passwort ist zu schwach — nutze Buchstaben, Zahlen und mind. 8 Zeichen.',
  'Not authenticated':            'Bitte melde dich erneut an.',
  'Session expired':              'Deine Sitzung ist abgelaufen. Bitte erneut einloggen.',
  'Not Found':                    'Nicht gefunden.',
  'no_credits':                   'Dein KI-Guthaben ist verbraucht. Bitte in den Einstellungen auffüllen.',
};

const _translate = (msg) => {
  if (!msg) return msg;
  const trimmed = String(msg).trim();
  if (EN_TO_DE[trimmed]) return EN_TO_DE[trimmed];
  // case-insensitive fallback
  const hit = Object.keys(EN_TO_DE).find((k) => k.toLowerCase() === trimmed.toLowerCase());
  return hit ? EN_TO_DE[hit] : trimmed;
};

export const parseAuthError = (err, fallback = 'Etwas ist schiefgelaufen.') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return _translate(err?.message) || fallback;
  if (typeof detail === 'string') return _translate(detail);
  if (Array.isArray(detail)) {
    // Pydantic validation errors → join user-readable messages
    return detail
      .map(e => {
        const field = Array.isArray(e?.loc) ? e.loc[e.loc.length - 1] : '';
        const msg = (e?.msg || '').replace(/^Value error,\s*/i, '');
        return field ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join(' · ');
  }
  return fallback;
};
