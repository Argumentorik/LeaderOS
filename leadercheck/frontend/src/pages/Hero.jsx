import { useNavigate } from "react-router-dom";
import MariaWay from "../components/hero/MariaWay";
import HeroATF from "../components/hero/HeroATF";
import ProblemSection from "../components/hero/ProblemSection";
import ThreeLayersSection from "../components/hero/ThreeLayersSection";
import DiagnoseStepsSection from "../components/hero/DiagnoseStepsSection";
import AgentsCarouselSection from "../components/hero/AgentsCarouselSection";
import WladBotSection from "../components/hero/WladBotSection";
import LeadershipKursSection from "../components/hero/LeadershipKursSection";
import AudiencesSection from "../components/hero/AudiencesSection";
import SocialProofSection from "../components/hero/SocialProofSection";
import WladTrustSection from "../components/hero/WladTrustSection";
import FreeCreditsSection from "../components/hero/FreeCreditsSection";
import FinalCTASection from "../components/hero/FinalCTASection";
import HeroFooter from "../components/hero/HeroFooter";

/**
 * Hero — Landing page orchestrator.
 * Each visual section lives in /components/hero/*Section.jsx; this file only
 * sequences them and wires up navigation callbacks.
 */
export default function Hero() {
  const navigate = useNavigate();
  const goToDiagnose = () => navigate("/diagnose");
  const goToKurse = () => navigate("/kurse");

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-hidden" data-testid="hero-page">
      {/* Background effects */}
      <div className="hero-glow-center" />
      <div className="hero-glow-lime" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        <HeroATF onCtaClick={goToDiagnose} />
        <ProblemSection />
        <ThreeLayersSection />
        <DiagnoseStepsSection />
        <AgentsCarouselSection />
        <WladBotSection />
        <LeadershipKursSection onKurseClick={goToKurse} />
        <AudiencesSection />
        <SocialProofSection />
        <WladTrustSection />
        <MariaWay />
        <FreeCreditsSection onCtaClick={goToDiagnose} />
        <FinalCTASection onCtaClick={goToDiagnose} />
        <HeroFooter />
      </div>
    </div>
  );
}
