import { DashboardLayout } from '../layout/DashboardLayout';
import { CoachQuestion, ActionQuestion, MultipleChoiceQuestion } from './QuestionTypes';

/**
 * QuizView · Nike Athletic-Editorial DNA.
 *
 * Flat black/white canvas, 2px-Schwarz-Borders, Outfit-Black-Italic
 * Frage-Nummer, Lime-Akzent als einziger chromatischer Moment,
 * Mono-BIB-Metadata. Keine Gradients, keine generischen Badges ·
 * siehe frontend/DESIGN.md.
 */
export const QuizView = ({
  quizMode, currentQ, setCurrentQ, answers, selectAnswer,
  submitQuiz, submitting, de, setQuizMode
}) => {
  const q = quizMode.questions[currentQ];
  const total = quizMode.questions.length;
  const allAnswered = Object.keys(answers).length >= total;
  const pct = Math.round(((currentQ + 1) / total) * 100);

  return (
    <DashboardLayout>
      <div className="bg-white text-black min-h-screen" data-testid="quiz-mode">
        {/* Sticky Progress-Header · Specimen-Stil */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b-2 border-black">
          <div className="max-w-2xl mx-auto px-5 md:px-6 py-4">
            <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-[0.22em] font-mono text-black/60">
              <button
                onClick={() => setQuizMode(null)}
                className="hover:text-black transition-colors"
                data-testid="quiz-back-btn"
              >
                ← {de ? 'Zurück' : 'Back'}
              </button>
              <span className="text-brand">
                {de ? `TAG ${quizMode.day}` : `DAY ${quizMode.day}`} · {quizMode.challenge?.agent}
              </span>
              <span>{currentQ + 1} / {total}</span>
            </div>
            {/* Progress-Bar flat */}
            <div className="h-1.5 bg-black/10 overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 md:px-6 py-10 md:py-14">
          {q && (
            <div className="animate-fade-in" key={`quiz-q-${currentQ}`}>
              {/* Riesige Frage-Nummer als visueller Anker */}
              <div className="flex items-baseline gap-4 mb-8">
                <span
                  className="text-brand leading-[0.8] tracking-[-0.04em]"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(72px, 16vw, 128px)' }}
                >
                  {String(currentQ + 1).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono pb-4">
                  / {String(total).padStart(2, '0')}<br />FRAGE
                </span>
              </div>

              {/* Frage-Card mit 2px Border */}
              <div className="border-2 border-black p-6 md:p-8 space-y-6">
                {q.type === 'coach' ? (
                  <CoachQuestion q={q} currentQ={currentQ} answers={answers} selectAnswer={selectAnswer} de={de} />
                ) : q.type === 'action' ? (
                  <ActionQuestion q={q} currentQ={currentQ} answers={answers} selectAnswer={selectAnswer} de={de} />
                ) : (
                  <MultipleChoiceQuestion q={q} currentQ={currentQ} answers={answers} selectAnswer={selectAnswer} />
                )}
              </div>

              {/* Nav-Row */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0}
                  className="text-[12px] font-bold uppercase tracking-[0.18em] text-black/60 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← {de ? 'Zurück' : 'Previous'}
                </button>

                {currentQ < total - 1 ? (
                  <button
                    onClick={() => setCurrentQ(currentQ + 1)}
                    disabled={answers[currentQ] === undefined}
                    data-testid="quiz-next-btn"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-[0.18em] hover:bg-black/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {de ? 'Weiter' : 'Next'} →
                  </button>
                ) : (
                  <button
                    onClick={submitQuiz}
                    disabled={!allAnswered || submitting}
                    data-testid="quiz-submit-btn"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-black text-[12px] font-bold uppercase tracking-[0.18em] shadow-[0_8px_24px_-8px_rgba(191,255,0,0.6)] hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (de ? 'Wertet aus…' : 'Scoring…') : (de ? 'Auswerten' : 'Submit')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Question-Dots · flat */}
          <div className="flex justify-center flex-wrap gap-2 mt-10">
            {Array.from({ length: total }).map((_, dotIdx) => (
              <button
                key={`dot-${dotIdx}`}
                onClick={() => setCurrentQ(dotIdx)}
                aria-label={`Frage ${dotIdx + 1}`}
                className={`w-2.5 h-2.5 transition-all ${
                  dotIdx === currentQ
                    ? 'bg-brand scale-125'
                    : answers[dotIdx] !== undefined
                    ? 'bg-black'
                    : 'bg-black/15 hover:bg-black/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
