import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { questions, CATEGORIES, CATEGORY_COLORS } from "../data/questions";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Quiz() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  // Guard: redirect if no user session
  useEffect(() => {
    const user = localStorage.getItem("emergent_user");
    if (!user) navigate("/diagnose");
  }, [navigate]);

  const question = questions[current];
  const progress = ((current) / questions.length) * 100;
  const isAnswered = answers[question?.id] !== undefined;

  const handleSelect = (option) => {
    if (animating || selected !== null) return;
    setSelected(option.id);

    setTimeout(() => {
      setAnswers(prev => ({
        ...prev,
        [question.id]: { ...option, question_id: question.id, category: question.category, layer: question.layer }
      }));

      if (current < questions.length - 1) {
        setAnimating(true);
        setTimeout(() => {
          setCurrent(c => c + 1);
          setSelected(null);
          setAnimating(false);
        }, 350);
      } else {
        // Last question
        setSelected(null);
      }
    }, 400);
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setSelected(null);
    }
  };

  const handleSubmit = () => {
    const answersArray = Object.values(answers).map(a => ({
      question_id: a.question_id,
      category: a.category,
      layer: a.layer,
      score: a.score,
    }));

    const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
    navigate("/analyzing", { state: { answers: answersArray, session_id: user.session_id } });
  };

  if (!question) return null;

  const catColor = CATEGORY_COLORS[question.category] || "#3B82F6";
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-noir-bg pt-20 px-4 pb-12" data-testid="quiz-page">
      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-noir-bg border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-manrope text-xs font-medium text-slate-500 tracking-wider">
            FRAGE {current + 1} VON {questions.length}
          </span>
          <span className="font-manrope text-xs font-medium" style={{ color: catColor }}>
            {CATEGORIES[question.category]}
          </span>
        </div>
        <div className="h-[2px] bg-noir-border">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto pt-16" style={{ opacity: animating ? 0 : 1, transition: "opacity 0.3s ease" }}>
        {/* Category badge */}
        <div
          className="inline-flex items-center gap-2 border px-3 py-1.5 mb-6"
          style={{ borderColor: `${catColor}30`, backgroundColor: `${catColor}08` }}
          data-testid="question-category"
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
          <span className="font-manrope text-xs font-medium tracking-[0.2em] uppercase" style={{ color: catColor }}>
            {CATEGORIES[question.category]}
          </span>
        </div>

        {/* Scenario */}
        <div className="mb-2" data-testid="question-scenario">
          <span className="font-manrope text-xs font-medium tracking-[0.2em] uppercase text-slate-600 mb-2 block">
            Szenario
          </span>
          <p className="font-inter text-base text-slate-300 leading-relaxed border-l-2 border-white/10 pl-4">
            {question.scenario}
          </p>
        </div>

        {/* Question */}
        <h2 className="font-manrope font-bold text-xl md:text-2xl text-white mt-5 mb-8" data-testid="question-text">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-10" data-testid="question-options">
          {question.options.map((option, i) => {
            const isSelected = selected === option.id;
            const wasAnswered = answers[question.id]?.id === option.id;

            return (
              <button
                key={option.id}
                data-testid={`option-${option.id}`}
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className={`quiz-option w-full flex items-start gap-4 p-5 border text-left ${
                  isSelected || wasAnswered
                    ? "border-blue-500/50 bg-cold-dim"
                    : "border-white/8 bg-noir-surface"
                }`}
              >
                <span
                  className={`font-manrope font-bold text-sm w-6 h-6 flex items-center justify-center shrink-0 border mt-0.5 ${
                    isSelected || wasAnswered
                      ? "border-blue-500 text-blue-400 bg-blue-500/10"
                      : "border-white/20 text-slate-500"
                  }`}
                >
                  {option.id.toUpperCase()}
                </span>
                <span className={`font-inter text-sm leading-relaxed ${
                  isSelected || wasAnswered ? "text-white" : "text-slate-300"
                }`}>
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            data-testid="quiz-prev"
            onClick={handlePrev}
            disabled={current === 0}
            className="flex items-center gap-2 font-manrope text-sm text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>

          <div className="flex items-center gap-2">
            <span className="font-inter text-xs text-slate-600">{answeredCount} beantwortet</span>
          </div>

          {current === questions.length - 1 && answers[question.id] !== undefined && (
            <button
              data-testid="quiz-submit"
              onClick={handleSubmit}
              className="btn-primary px-6 py-3 font-manrope text-xs tracking-widest uppercase flex items-center gap-2"
            >
              Diagnose abschließen
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {current < questions.length - 1 && answers[question.id] !== undefined && (
            <button
              data-testid="quiz-next"
              onClick={() => {
                setCurrent(c => c + 1);
                setSelected(null);
              }}
              className="flex items-center gap-2 font-manrope text-sm text-slate-400 hover:text-white transition-colors"
            >
              Weiter
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
