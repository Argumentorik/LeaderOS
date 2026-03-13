import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestionsForRole, CATEGORIES, CATEGORY_COLORS } from "../data/questions";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("emergent_user");
    if (!user) {
      navigate("/diagnose");
      return;
    }
    const userData = JSON.parse(user);
    const role = userData.role || 'selbststaendige';
    const roleQuestions = getQuestionsForRole(role);
    setQuestions(roleQuestions);
  }, [navigate]);

  const question = questions[current];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  const handleSelect = (option) => {
    if (animating || selected !== null) return;
    setSelected(option.id);

    setTimeout(() => {
      setAnswers(prev => ({
        ...prev,
        [question.id]: {
          question_id: question.id,
          category: question.category,
          layer: question.layer,
          score: option.score
        }
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
    const answersArray = Object.values(answers);
    const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
    navigate("/analyzing", { state: { answers: answersArray, session_id: user.session_id || user.user_id } });
  };

  if (!question) return null;

  const catColor = CATEGORY_COLORS[question.category] || "#F59E0B";
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#030303] pt-20 px-4 pb-12" data-testid="quiz-page">
      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#030303]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-inter text-xs text-slate-500">
            Frage {current + 1} von {questions.length}
          </span>
          <span
            className="badge-blue px-3 py-1 text-xs"
            style={{ borderColor: `${catColor}30`, background: `${catColor}10`, color: catColor }}
          >
            {CATEGORIES[question.category]}
          </span>
        </div>
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-500 ease-out"
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
            const isActive = isSelected;

            return (
              <button
                key={option.id}
                data-testid={`option-${option.id}`}
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className={`quiz-option w-full flex items-start gap-4 p-5 border text-left ${
                  isActive
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <span
                  className={`font-manrope font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? "bg-amber-500 text-black"
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

          <span className="font-inter text-xs text-slate-600">
            {answeredCount} / {questions.length} beantwortet
          </span>

          {current === questions.length - 1 && answers[question.id] !== undefined && (
            <button
              data-testid="quiz-submit"
              onClick={handleSubmit}
              className="btn-amber px-6 py-3 font-medium flex items-center gap-2"
            >
              Deinen 30-Tage-Plan aktivieren
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
