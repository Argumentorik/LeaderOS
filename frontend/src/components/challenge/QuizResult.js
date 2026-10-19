import { DashboardLayout } from '../layout/DashboardLayout';

/**
 * QuizResult · Nike Athletic-Editorial DNA.
 *
 * Riesige Score-Zahl als Anker, flat black/white, 2px-Borders,
 * Lime-Akzent. Korrekt = schwarzer Haken, falsch = Lime-Pin ·
 * kein Ampel-Grün/Rot-Gradient-Soup. Siehe frontend/DESIGN.md.
 */
export const QuizResult = ({ quizResult, setQuizResult, setQuizMode, setCurrentQ, setAnswers, de }) => {
  const passed = quizResult.passed;
  return (
    <DashboardLayout>
      <div className="bg-white text-black min-h-screen" data-testid="quiz-result">
        <div className="max-w-2xl mx-auto px-5 md:px-6 py-12 md:py-16">

          {/* Score-Hero */}
          <div className="border-2 border-black p-8 md:p-10 text-center animate-fade-in">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand font-mono mb-4">
              ▸ {passed ? (de ? 'BESTANDEN' : 'PASSED') : (de ? 'WIEDERHOLEN EMPFOHLEN' : 'RETRY RECOMMENDED')}
            </div>
            <div
              className="text-black leading-[0.82] tracking-[-0.04em]"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(96px, 22vw, 200px)' }}
            >
              {quizResult.score}<span className="text-brand">%</span>
            </div>
            <div className="mt-4 text-[12px] font-bold uppercase tracking-[0.18em] text-black/60 font-mono">
              {quizResult.correct} / {quizResult.total} {de ? 'RICHTIG' : 'CORRECT'} · +{quizResult.xp_earned} XP
            </div>
          </div>

          {/* Explanations */}
          {quizResult.results?.length > 0 && (
            <div className="mt-8">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono mb-4">
                ▸ AUFLÖSUNG
              </div>
              <ul className="border-2 border-black divide-y divide-black/15">
                {quizResult.results.map((r, rIdx) => (
                  <li key={`res-${r.question?.slice(0, 20) || rIdx}`} className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <span
                        className={`shrink-0 mt-0.5 w-6 h-6 inline-flex items-center justify-center text-[13px] font-black ${
                          r.correct ? 'bg-black text-brand' : 'bg-brand text-black'
                        }`}
                        aria-hidden
                      >
                        {r.correct ? '✓' : '✕'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold leading-[1.3] text-black mb-1.5">{r.question}</p>
                        <p className="text-[13px] leading-[1.5] text-black/65">{r.explanation}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {!passed && (
              <button
                onClick={() => { setQuizResult(null); setCurrentQ(0); setAnswers({}); }}
                className="flex-1 px-6 py-3.5 border-2 border-black text-black text-[12px] font-bold uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors"
              >
                {de ? 'Nochmal versuchen' : 'Try Again'}
              </button>
            )}
            <button
              onClick={() => { setQuizMode(null); setQuizResult(null); }}
              className="flex-1 px-6 py-3.5 bg-brand text-black text-[12px] font-bold uppercase tracking-[0.18em] shadow-[0_8px_24px_-8px_rgba(191,255,0,0.6)] hover:bg-brand/90 transition-colors"
            >
              {de ? 'Weiter zum Plan →' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
