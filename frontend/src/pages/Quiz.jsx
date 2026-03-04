import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { questions, CATEGORIES, CATEGORY_COLORS } from "../data/questions";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export default function Quiz() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("emergent_user");
    if (!user) navigate("/diagnose");
  }, [navigate]);

  const question = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

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
        }, 300);
      } else {
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
    <div className="min-h-screen bg-[#030303] pt-20 px-4 pb-12" data-testid="quiz-page">
      {/* Progress Bar - Fixed */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#030303]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-inter text-xs text-slate-500">
            Frage {current + 1} von {questions.length}
          </span>
          <span className="badge-blue px-3 py-1 text-xs" style={{ borderColor: `${catColor}30`, background: `${catColor}10`, color: catColor }}>
            {CATEGORIES[question.category]}
          </span>
        </div>
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div 
        className="max-w-2xl mx-auto pt-16"
        style={{ 
          opacity: animating ? 0 : 1, 
          transform: animating ? 'translateX(-20px)' : 'translateX(0)',
          transition: "all 0.3s ease" 
        }}
      >
        {/* Scenario */}
        <div className="glass-card-subtle p-5 mb-6" data-testid="question-scenario">
          <span className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-2 block">
            Szenario
          </span>
          <p className="font-inter text-slate-300 leading-relaxed">
            {question.scenario}
          </p>
        </div>

        {/* Question */}
        <h2 className="font-manrope font-bold text-xl md:text-2xl text-white mb-8" data-testid="question-text">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-10" data-testid="question-options">
          {question.options.map((option) => {
            const isSelected = selected === option.id;
            const wasAnswered = answers[question.id]?.id === option.id;
            const isActive = isSelected || wasAnswered;

            return (
              <button
                key={option.id}
                data-testid={`option-${option.id}`}
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className={`quiz-option w-full flex items-start gap-4 p-5 border text-left ${
                  isActive
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <span
                  className={`font-manrope font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "bg-white/5 text-slate-500 border border-white/10"
                  }`}
                >
                  {isActive ? <Check className="w-4 h-4" /> : option.id.toUpperCase()}
                </span>
                <span className={`font-inter text-sm leading-relaxed pt-1 ${
                  isActive ? "text-white" : "text-slate-300"
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
            className="flex items-center gap-2 font-inter text-sm text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-full px-4 py-2 hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>

          <div className="flex items-center gap-3">
            <span className="font-inter text-xs text-slate-600">
              {answeredCount} / {questions.length} beantwortet
            </span>
          </div>

          {current === questions.length - 1 && answers[question.id] !== undefined && (
            <button
              data-testid="quiz-submit"
              onClick={handleSubmit}
              className="btn-primary px-6 py-3 font-medium flex items-center gap-2"
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
              className="flex items-center gap-2 font-inter text-sm text-slate-400 hover:text-white transition-colors rounded-full px-4 py-2 hover:bg-white/5"
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
