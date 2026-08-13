import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard, PenLine, MessageSquareText, Swords,
  BookOpen, Video, Wrench, ArrowRight, Sparkles, ChevronRight,
  Play
} from 'lucide-react';

const WLAD_AVATAR = 'https://leadercheck.de/wladbot-3-nobg.png';

const tourSteps = {
  de: [
    { icon: Sparkles, title: 'Willkommen bei WladBot!', desc: 'Dein persönliches AI Leadership Operating System. Lass mich dir kurz zeigen, wie alles funktioniert.' },
    { icon: LayoutDashboard, title: 'Kommandozentrale', desc: 'Dein Dashboard zeigt deinen Leader Score, tägliche Aufgaben und deinen Fortschritt — alles auf einen Blick.' },
    { icon: PenLine, title: 'Täglicher Check-in', desc: 'Starte jeden Tag mit einem Leadership-Moment. Beschreibe eine Entscheidung oder Herausforderung und erhalte sofort KI-Feedback.' },
    { icon: MessageSquareText, title: 'KI Coach mit 8 Agenten', desc: 'Wähle deinen Spezialisten — von Konflikt über EQ bis Strategie. Jeder Agent hat eigene Szenarien und Coaching-Stile.' },
    { icon: Swords, title: 'Simulationen & Challengers', desc: 'Übe echte Leadership-Gespräche mit KI-Charakteren. Lass dich von Bezos, Musk oder Oprah herausfordern.' },
    { icon: Wrench, title: 'Geführte Workflows', desc: 'Schritt-für-Schritt Funnels für 1:1-Vorbereitung, E-Mail-Optimierung, Entscheidungsfindung und mehr.' },
    { icon: Video, title: 'Missionen & Playbooks', desc: 'Nimm dich auf, lass die KI deine Delivery bewerten. Absolviere interaktive Playbooks mit persönlichem Report.' },
    { isVideo: true, title: 'Persönliche Nachricht von Wlad', desc: 'Wlad Jachtchenko erklärt dir, wie du das Maximum aus dem Leadership OS holst.' },
    { icon: Sparkles, title: "Los geht's!", desc: 'Dein Leadership-Journey beginnt jetzt. Starte mit dem täglichen Check-in oder sprich direkt mit deinem KI-Coach.', isFinal: true },
  ],
  en: [
    { icon: Sparkles, title: 'Welcome to WladBot!', desc: 'Your personal AI Leadership Operating System. Let me quickly show you how everything works.' },
    { icon: LayoutDashboard, title: 'Command Center', desc: 'Your dashboard shows your Leader Score, daily tasks and progress — everything at a glance.' },
    { icon: PenLine, title: 'Daily Check-in', desc: 'Start each day with a leadership moment. Describe a decision or challenge and get instant AI feedback.' },
    { icon: MessageSquareText, title: 'AI Coach with 8 Agents', desc: 'Choose your specialist — from Conflict to EQ to Strategy. Each agent has unique scenarios and coaching styles.' },
    { icon: Swords, title: 'Simulations & Challengers', desc: 'Practice real leadership conversations with AI characters. Get challenged by Bezos, Musk or Oprah.' },
    { icon: Wrench, title: 'Guided Workflows', desc: 'Step-by-step funnels for 1:1 prep, email optimization, decision making and more.' },
    { icon: Video, title: 'Missions & Playbooks', desc: 'Record yourself, let AI score your delivery. Complete interactive playbooks with personal reports.' },
    { isVideo: true, title: 'Personal Message from Wlad', desc: 'Wlad Jachtchenko explains how to get the most out of the Leadership OS.' },
    { icon: Sparkles, title: "Let's go!", desc: 'Your leadership journey starts now. Begin with the daily check-in or talk to your AI coach.', isFinal: true },
  ],
};

export const OnboardingTour = ({ onComplete }) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const steps = tourSteps[lang] || tourSteps.de;
  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  const handleComplete = () => { localStorage.setItem('wladbot_onboarding_done', 'true'); onComplete(); };
  const handleNext = () => { if (step < steps.length - 1) setStep(step + 1); else handleComplete(); };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md" data-testid="onboarding-tour">
      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06]">

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-white/[0.04]">
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: '#BFFF00' }} />
          </div>

          <div className="p-8 text-center">
            {/* Skip */}
            {!current.isFinal && (
              <button onClick={handleComplete} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-[12px] font-medium transition-colors" data-testid="tour-skip-btn">
                {lang === 'de' ? 'Überspringen' : 'Skip'}
              </button>
            )}

            {/* Video Step */}
            {current.isVideo ? (
              <div className="mb-5">
                <div className="relative w-full aspect-video rounded-xl bg-[#0A0A0A] overflow-hidden group cursor-pointer mb-4">
                  <img src={WLAD_AVATAR} alt="Wlad Jachtchenko" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#BFFF00]/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-[#BFFF00]/30">
                      <Play size={28} className="text-[#BFFF00] ml-1" />
                    </div>
                    <p className="text-white/60 text-[12px] font-semibold mt-3">
                      {lang === 'de' ? 'Video kommt bald' : 'Video coming soon'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Icon */
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg animate-breathe"
                style={{ background: current.isFinal ? '#00CC77' : '#0A0A0A' }}>
                {Icon && <Icon size={28} className={current.isFinal ? 'text-white' : 'text-[#BFFF00]'} />}
              </div>
            )}

            {/* Step counter */}
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              {step + 1} / {steps.length}
            </p>

            <h2 className="text-xl font-black tracking-tight mb-2">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">{current.desc}</p>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {steps.map((_, i) => (
                <div key={`dot-${i}`} className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6' : 'w-1.5'
                }`} style={{
                  background: i === step ? '#BFFF00' : i < step ? 'rgba(191,255,0,0.3)' : 'rgba(128,128,128,0.2)'
                }} />
              ))}
            </div>

            {/* Actions */}
            {current.isFinal ? (
              <div className="space-y-3">
                <Button onClick={() => { handleComplete(); navigate('/daily-checkin'); }}
                  className="w-full font-bold h-12 text-black" style={{ background: '#BFFF00' }}
                  data-testid="tour-start-checkin-btn">
                  {lang === 'de' ? 'Mit Check-in starten' : 'Start with Check-in'} <ArrowRight size={16} className="ml-2" />
                </Button>
                <Button variant="outline" onClick={() => { handleComplete(); navigate('/chat'); }}
                  className="w-full font-semibold h-10 border-black/10 dark:border-white/10" data-testid="tour-start-chat-btn">
                  {lang === 'de' ? 'Direkt zum KI-Coach' : 'Go to AI Coach'} <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleNext}
                className="font-bold px-8 h-11 text-black" style={{ background: '#BFFF00' }}
                data-testid="tour-next-btn">
                {lang === 'de' ? 'Weiter' : 'Next'} <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
