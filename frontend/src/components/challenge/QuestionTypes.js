/**
 * QuestionTypes · Nike Athletic-Editorial DNA.
 *
 * Drei Frage-Typen (Coach · Action · MultipleChoice). Flat black/white,
 * 2px-Borders, Lime-Akzent für aktive States, Mono-Eyebrows statt
 * bunter Gradient-Badges. Buchstaben-Marker A/B/C/D als schwarze
 * Quadrate. Siehe frontend/DESIGN.md.
 */

const TaskBlock = ({ q, currentQ, answers, selectAnswer, de, eyebrow, ctaLabel }) => (
  <>
    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
      ▸ {eyebrow}
    </div>
    <h3
      className="text-[20px] md:text-[24px] leading-[1.2] tracking-[-0.015em] text-black"
      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}
    >
      {q.q}
    </h3>
    <div className="border border-black/15 p-4 space-y-4 bg-[#FAFAF7]">
      <p className="text-[13.5px] leading-[1.5] text-black/65">
        {de
          ? 'Öffne in einem neuen Tab, führe die Aufgabe durch, komm danach zurück und markiere als erledigt.'
          : 'Open in a new tab, complete the task, come back and mark as done.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => window.open(q.path, '_blank')}
          className="flex-1 px-4 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-[0.16em] hover:bg-black/85 transition-colors"
          data-testid="task-open-btn"
        >
          {ctaLabel}
        </button>
        <button
          onClick={() => selectAnswer(currentQ, 1)}
          className="px-5 py-3 border-2 border-black text-black text-[12px] font-bold uppercase tracking-[0.16em] hover:bg-brand hover:border-brand transition-colors"
          data-testid="task-done-btn"
        >
          {de ? 'Erledigt' : 'Done'}
        </button>
      </div>
      {answers[currentQ] !== undefined && (
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-black font-mono flex items-center gap-2">
          <span className="w-4 h-4 bg-black text-brand inline-flex items-center justify-center text-[10px] font-black">✓</span>
          {de ? 'Als erledigt markiert' : 'Marked as done'}
        </p>
      )}
    </div>
  </>
);

export const CoachQuestion = (props) => (
  <TaskBlock
    {...props}
    eyebrow="KI-COACH AUFGABE"
    ctaLabel={props.de ? 'KI-Coach öffnen' : 'Open AI Coach'}
  />
);

export const ActionQuestion = (props) => (
  <TaskBlock
    {...props}
    eyebrow="PRAXIS-AUFGABE"
    ctaLabel={props.de ? 'Tool öffnen' : 'Open Tool'}
  />
);

export const MultipleChoiceQuestion = ({ q, currentQ, answers, selectAnswer }) => (
  <>
    <h3
      className="text-[20px] md:text-[24px] leading-[1.2] tracking-[-0.015em] text-black"
      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}
    >
      {q.q}
    </h3>
    <div className="space-y-2.5">
      {q.options?.map((opt, optIdx) => {
        const active = answers[currentQ] === optIdx;
        return (
          <button
            key={`q${currentQ}-opt${optIdx}`}
            onClick={() => selectAnswer(currentQ, optIdx)}
            data-testid={`quiz-option-${optIdx}`}
            className={`w-full p-4 text-left transition-all border-2 ${
              active
                ? 'border-black bg-brand/15'
                : 'border-black/15 bg-white hover:border-black/50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`w-8 h-8 inline-flex items-center justify-center text-[13px] font-black shrink-0 transition-colors ${
                  active ? 'bg-black text-brand' : 'bg-black/[0.06] text-black/55'
                }`}
              >
                {String.fromCharCode(65 + optIdx)}
              </span>
              <span className="text-[14.5px] leading-[1.4] font-medium text-black">{opt}</span>
            </div>
          </button>
        );
      })}
    </div>
  </>
);
