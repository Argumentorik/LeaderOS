import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestionsForRole, CATEGORIES, CATEGORY_COLORS } from "../data/questions";
import { ChevronLeft, ChevronRight, Check, Bot, Send, Sparkles } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function WladBotChat({ onContinue }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hey! Ich bin Wlad. Glückwunsch – du hast gerade alle 30 Fragen durchgezogen. Respekt. Bevor ich deinen Report erstelle, wollte ich kurz mit dir sprechen. Was ist gerade deine größte Leadership-Herausforderung? Schreib mir einfach, wie du es einem guten Freund erzählen würdest."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const bottomRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/coach/chat`, {
        session_id: user.session_id || "demo",
        message: `[Vor-Report Gespräch] Der Nutzer hat gerade 30 Diagnose-Fragen beantwortet. Sei nahbar, empathisch und wie ein erfahrener Freund (Wlad). Antworte kurz und persönlich auf: ${text}`,
      });
      setMessages(prev => [...prev, { role: "assistant", text: res.data.response }]);
      setCanContinue(true);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Danke fürs Teilen. Lass uns jetzt deinen Report anschauen!" }]);
      setCanContinue(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-8" data-testid="wladbot-q30">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
          <Bot className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <div className="font-manrope font-bold text-lg text-white">WladBot</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-inter text-xs text-slate-500">Wlad ist online</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="glass-card p-5 mb-4" style={{ maxHeight: "350px", overflowY: "auto" }}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-4 py-3 text-sm font-inter leading-relaxed rounded-2xl ${
                msg.role === "user"
                  ? "bg-amber-500/20 text-white border border-amber-500/20 rounded-br-md"
                  : "bg-white/5 text-slate-300 border border-white/5 rounded-bl-md"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-amber-500 analyzing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 mb-6">
        <input
          data-testid="wladbot-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Schreib Wlad..."
          disabled={loading}
          className="flex-1 input-modern h-12 px-4 font-inter text-sm text-white placeholder:text-slate-600"
        />
        <button
          data-testid="wladbot-send"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center hover:bg-amber-400 transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* Continue Button */}
      <button
        data-testid="wladbot-continue"
        onClick={onContinue}
        className={`w-full btn-amber py-4 font-semibold flex items-center justify-center gap-3 transition-all ${
          canContinue ? "opacity-100" : "opacity-60"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        Deinen 30-Tage-Plan aktivieren
        <ChevronRight className="w-4 h-4" />
      </button>

      <p className="font-inter text-xs text-slate-600 text-center mt-3">
        Du kannst auch direkt fortfahren – das Gespräch ist optional
      </p>
    </div>
  );
}

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [showWladBot, setShowWladBot] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("emergent_user");
    if (!user) { navigate("/diagnose"); return; }
    const userData = JSON.parse(user);
    const role = userData.role || 'selbststaendige';
    setQuestions(getQuestionsForRole(role));
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
        // Last question answered → show WladBot
        setTimeout(() => {
          setSelected(null);
          setShowWladBot(true);
        }, 300);
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

  // Show WladBot chat after Q30
  if (showWladBot) {
    return (
      <div className="min-h-screen bg-[#030303] pt-20 px-4 pb-12" data-testid="quiz-page">
        <div className="fixed top-16 left-0 right-0 z-40 bg-[#030303]/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="font-inter text-xs text-slate-500">Alle 30 Fragen beantwortet</span>
            <span className="badge-amber px-3 py-1 text-xs">WladBot</span>
          </div>
          <div className="h-1 bg-amber-500" />
        </div>
        <WladBotChat onContinue={handleSubmit} />
      </div>
    );
  }

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
          <span className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-2 block">Szenario</span>
          <p className="font-inter text-slate-300 leading-relaxed">{question.scenario}</p>
        </div>

        {/* Question */}
        <h2 className="font-manrope font-bold text-xl md:text-2xl text-white mb-8" data-testid="question-text">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-10" data-testid="question-options">
          {question.options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                data-testid={`option-${option.id}`}
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className={`quiz-option w-full flex items-start gap-4 p-5 border text-left ${
                  isSelected ? "border-amber-500/50 bg-amber-500/10" : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <span className={`font-manrope font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? "bg-amber-500 text-black" : "bg-white/5 text-slate-500 border border-white/10"
                }`}>
                  {isSelected ? <Check className="w-4 h-4" /> : option.id.toUpperCase()}
                </span>
                <span className={`font-inter text-sm leading-relaxed pt-1 ${isSelected ? "text-white" : "text-slate-300"}`}>
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

          {current < questions.length - 1 && answers[question.id] !== undefined && (
            <button
              data-testid="quiz-next"
              onClick={() => { setCurrent(c => c + 1); setSelected(null); }}
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
