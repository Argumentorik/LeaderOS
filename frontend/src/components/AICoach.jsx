import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, ChevronDown } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const presets = [
  "Boardroom-Rhetorik verbessern",
  "KI als Führungshebel nutzen",
  "Strategisches EQ stärken",
  "Meine nächsten Schritte",
];

export default function AICoach() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, ich bin der WladBot! Ich hab deinen Report gesehen – starkes Profil. Frag mich alles rund um Leadership, KI-Strategie oder deinen nächsten Karriereschritt. Ich bin direkt und ehrlich – versprochen.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/coach/chat`, {
        session_id: user.session_id || "demo",
        message: text,
      });
      setMessages(prev => [...prev, { role: "assistant", text: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Der Coach ist kurz nicht verfügbar. Bitte versuche es in einem Moment erneut.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        data-testid="ai-coach-toggle"
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          open 
            ? "bg-white/10 border border-white/20" 
            : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_8px_40px_rgba(59,130,246,0.6)]"
        }`}
        aria-label="AI Coach öffnen"
      >
        {open ? <ChevronDown className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          data-testid="ai-coach-panel"
          className="coach-panel fixed bottom-24 right-6 z-50 w-80 md:w-96 flex flex-col bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)]"
          style={{ height: "500px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-manrope font-bold text-white">WladBot</div>
                <div className="flex items-center gap-2">
                  <span className="dot-pulse" style={{ width: 6, height: 6 }} />
                  <span className="font-inter text-xs text-slate-500">Dein AI Leadership-Coach</span>
                </div>
              </div>
            </div>
            <button
              data-testid="ai-coach-close"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 glass-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm font-inter leading-relaxed rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-white/5 text-slate-300 border border-white/5 rounded-bl-md"
                  }`}
                  data-testid={`coach-message-${msg.role}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="analyzing-dot w-2 h-2 rounded-full bg-blue-500"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Preset prompts */}
          <div className="px-4 py-2 border-t border-white/5">
            <div className="flex gap-2 overflow-x-auto pb-1 glass-scrollbar">
              {presets.map((p, i) => (
                <button
                  key={i}
                  data-testid={`preset-${i}`}
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                  className="shrink-0 badge-blue px-3 py-1.5 text-xs hover:bg-blue-500/20 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                data-testid="ai-coach-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Frage stellen..."
                disabled={loading}
                className="flex-1 input-modern h-10 px-4 font-inter text-sm text-white placeholder:text-slate-600"
              />
              <button
                data-testid="ai-coach-send"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center hover:bg-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
