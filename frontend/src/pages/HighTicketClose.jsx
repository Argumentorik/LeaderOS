import { useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink, Download, Brain, Shield, Zap, Sparkles, Share2 } from "lucide-react";

const stats = [
  { value: "3.7x", label: "mehr Resignationen ohne aktive Führungsentwicklung" },
  { value: "65%", label: "höheres Team-Engagement in Coaching-Kulturen" },
  { value: "40%", label: "der Führungskräfte erwägen Kündigung durch Überlastung" },
];

const options = [
  {
    badge: "EMPFOHLEN",
    badgeStyle: "bg-gradient-to-r from-amber-500 to-amber-400 text-black",
    title: "Vollzugang: WLADBOT Plattform",
    subtitle: "Das komplette Leadership-System",
    price: "Kostenloser Einstieg",
    cta: "Jetzt kostenlos starten",
    ctaStyle: "btn-amber",
    href: "https://polar.sh",
    external: true,
    features: [
      "AI Coach + Tasks + Simulation",
      "Playbooks & Events",
      "Community-Zugang",
      "Strategy Canvas & Decision-Frameworks",
    ],
    icon: Brain,
    highlight: true,
  },
  {
    badge: "PDF",
    badgeStyle: "badge-blue",
    title: "Curriculum PDF",
    subtitle: "Vollständiger Kurs-Überblick",
    price: "Kostenlos",
    cta: "Curriculum herunterladen",
    ctaStyle: "btn-secondary",
    href: "#",
    external: false,
    features: [
      "Alle 7 Module im Überblick",
      "Lernziele pro Modul",
      "30-Tage-Fahrplan als Dokument",
      "Leadership-Framework-Referenz",
    ],
    icon: Download,
    highlight: false,
  },
];

// Social icons as SVG components
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const socialLinks = [
  { 
    name: "Instagram", 
    icon: InstagramIcon, 
    href: "https://instagram.com/wladhub", 
    color: "from-pink-500 via-red-500 to-yellow-500",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]",
    label: "Folge uns"
  },
  { 
    name: "Facebook Gruppe", 
    icon: FacebookIcon, 
    href: "https://facebook.com/groups/wladhub", 
    color: "from-blue-600 to-blue-400",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]",
    label: "Gruppe beitreten"
  },
  { 
    name: "LinkedIn", 
    icon: LinkedInIcon, 
    href: "https://linkedin.com", 
    color: "from-blue-700 to-blue-500",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(29,78,216,0.4)]",
    label: "Diagnose teilen"
  },
];

export default function HighTicketClose() {
  const navigate = useNavigate();

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent("Ich habe gerade meine WLADHUB Leadership-Diagnose gemacht! 🚀");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#030303] pb-24 overflow-hidden" data-testid="close-page">
      {/* Enhanced Background Effects with Depth */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary amber glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-br from-amber-500/8 via-orange-500/4 to-transparent rounded-full blur-[200px] animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Secondary blue glow */}
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/6 via-cyan-500/3 to-transparent rounded-full blur-[180px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        {/* Accent purple glow */}
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        {/* Floating particles effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400/40 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header with enhanced animation */}
        <div className="text-center mb-14 opacity-0 anim-fade-up">
          <div className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6 animate-pulse" style={{ animationDuration: '3s' }}>
            <Sparkles className="w-4 h-4" />
            Deine Leadership-Transformation
          </div>
          <h1
            className="font-manrope font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4"
            data-testid="close-headline"
          >
            Wir automatisieren
            <br />
            keine Leader.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent animate-gradient-x">
              Wir upgraden sie.
            </span>
          </h1>
          <p className="font-inter text-lg text-slate-500 max-w-2xl mx-auto mt-6">
            Die Zukunft gehört nicht den Intelligentesten. Sie gehört den Klarsten,
            den Komponiertesten und den strategisch Empathischsten.
          </p>
        </div>

        {/* The Comparison with enhanced depth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14 opacity-0 anim-fade-up delay-1" data-testid="close-comparison">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="glass-card-subtle p-6 relative">
              <div className="font-inter text-xs tracking-widest text-slate-600 mb-4">
                OHNE SYSTEM
              </div>
              <div className="space-y-3">
                {["KI übernimmt Entscheidungsprozesse", "Autorität erodiert langsam", "Team sucht Führung bei Tools", "3.7x höhere Resignationsrate"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-500 font-inter text-sm group/item hover:text-slate-400 transition-colors">
                    <span className="w-5 h-px bg-gradient-to-r from-red-500/50 to-transparent shrink-0 group-hover/item:w-8 transition-all duration-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="glass-card p-6 relative card-glow-amber">
              <div className="font-inter text-xs tracking-widest text-amber-400 mb-4">
                MIT WLADHUB
              </div>
              <div className="space-y-3">
                {["KI als strategischen Hebel nutzen", "Boardroom-Autorität stärken", "Team folgt deiner Richtung", "65% höheres Team-Engagement"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-300 font-inter text-sm group/item hover:text-white transition-colors">
                    <Shield className="w-4 h-4 text-amber-500 shrink-0 group-hover/item:scale-110 transition-transform" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats with enhanced animation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14 opacity-0 anim-fade-up delay-2" data-testid="close-stats">
          {stats.map((s, i) => (
            <div key={i} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="glass-card-subtle p-6 text-center hover-card relative">
                <div className="font-manrope font-extrabold text-3xl md:text-4xl bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                  {s.value}
                </div>
                <div className="font-inter text-sm text-slate-500 leading-relaxed">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Options - 2 columns now */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14 opacity-0 anim-fade-up delay-3" data-testid="close-options">
          {options.map((opt, i) => (
            <div 
              key={i} 
              className={`relative group flex flex-col p-6 rounded-2xl transition-all duration-500 ${
                opt.highlight 
                  ? "glass-card border border-amber-500/20" 
                  : "glass-card-subtle"
              }`} 
              data-testid={`close-option-${i}`}
            >
              {/* Glow effect for highlighted card */}
              {opt.highlight && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              )}
              
              {/* Badge */}
              <div className={`inline-flex self-start text-xs font-semibold tracking-wider px-3 py-1.5 rounded-full mb-4 ${opt.badgeStyle}`}>
                {opt.badge}
              </div>

              {/* Icon with glow */}
              <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                opt.highlight ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10" : "bg-white/5"
              }`}>
                {opt.highlight && (
                  <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-md animate-pulse" style={{ animationDuration: '2s' }} />
                )}
                <opt.icon className={`relative w-6 h-6 ${opt.highlight ? "text-amber-400" : "text-slate-400"}`} />
              </div>

              {/* Title */}
              <h3 className="font-manrope font-bold text-xl text-white mb-1">{opt.title}</h3>
              <p className="font-inter text-sm text-slate-500 mb-2">{opt.subtitle}</p>
              <div className="font-manrope font-bold text-white mb-5">{opt.price}</div>

              {/* Features */}
              <div className="space-y-2 mb-6 flex-1">
                {opt.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-2 group/feature">
                    <Zap className={`w-3 h-3 shrink-0 mt-1 transition-transform group-hover/feature:scale-125 ${opt.highlight ? "text-amber-500" : "text-slate-600"}`} />
                    <span className="font-inter text-sm text-slate-400 leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {opt.external ? (
                <a
                  data-testid={`close-cta-${i}`}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${opt.ctaStyle} w-full py-3.5 font-medium flex items-center justify-center gap-2 group/btn`}
                >
                  {opt.cta}
                  <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </a>
              ) : (
                <button
                  data-testid={`close-cta-${i}`}
                  className={`${opt.ctaStyle} w-full py-3.5 font-medium flex items-center justify-center gap-2 group/btn`}
                >
                  {opt.cta}
                  <Download className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Social Section - NEW */}
        <div className="mb-14 opacity-0 anim-fade-up delay-4">
          <div className="text-center mb-8">
            <div className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-4">
              <Share2 className="w-4 h-4" />
              Werde Teil der Community
            </div>
            <h3 className="font-manrope font-bold text-2xl text-white">
              Vernetze dich mit anderen Leadern
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {socialLinks.map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={social.name === "LinkedIn" ? (e) => { e.preventDefault(); shareOnLinkedIn(); } : undefined}
                className={`group relative flex flex-col items-center p-6 rounded-2xl glass-card-subtle transition-all duration-300 ${social.hoverGlow} hover:scale-[1.02]`}
                data-testid={`social-${social.name.toLowerCase().replace(' ', '-')}`}
              >
                {/* Gradient border on hover */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${social.color} rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300`} />
                
                <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${social.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <social.icon />
                </div>
                
                <span className="font-manrope font-bold text-white mb-1">{social.name}</span>
                <span className="font-inter text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
                  {social.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Philosophy with enhanced depth */}
        <div className="relative mb-12 opacity-0 anim-fade-up delay-5">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 rounded-3xl blur-xl" />
          <div className="glass-card p-10 text-center relative">
            <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-6">
              Die nächste Generation von Leadern wird nicht durch Intelligenz definiert.
            </h2>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {["Klarheit unter Druck", "Ethisches Urteilsvermögen", "Überzeugende Kommunikation", "Emotionale Regulation", "Strategische Richtung"].map((q, i) => (
                <div 
                  key={i} 
                  className="badge-white px-4 py-2 text-sm hover:bg-white/10 transition-colors cursor-default"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {q}
                </div>
              ))}
            </div>
            <p className="font-inter text-slate-500">
              KI kann Intelligenz assistieren. <span className="text-white font-medium">Nur du kannst Leadership verkörpern.</span>
            </p>
          </div>
        </div>

        {/* Final CTA with enhanced glow */}
        <div className="text-center opacity-0 anim-fade-up delay-6">
          <p className="font-manrope font-bold text-sm tracking-widest text-slate-500 mb-6">
            SCHLIESSE DICH DEN LEADERN AN, DIE SICH WEIGERN, ERSETZBAR ZU WERDEN
          </p>
          <div className="relative inline-block group">
            {/* Animated glow behind button */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" style={{ animationDuration: '2s' }} />
            <a
              data-testid="close-final-cta"
              href="https://polar.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="relative btn-amber px-12 py-4 font-semibold inline-flex items-center gap-3"
            >
              Jetzt Vollzugang sichern
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Animated gradient keyframes */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(0) translateX(20px); }
          75% { transform: translateY(20px) translateX(10px); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
