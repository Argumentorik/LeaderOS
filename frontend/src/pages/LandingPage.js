import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LandingNav } from '../components/landing/LandingNav';
import { ClassScarcityBanner } from '../components/landing/ClassScarcityBanner';
import { HeroSection } from '../components/landing/HeroSection';
import { WhatIsLeaderOsSection } from '../components/landing/WhatIsLeaderOsSection';
import { SprintSpecimenStrip } from '../components/landing/SprintSpecimenStrip';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { WladIntroVideo } from '../components/landing/WladIntroVideo';
import { TrackFieldSection } from '../components/landing/TrackFieldVisual';
import { MiniChallenge } from '../components/landing/MiniChallenge';
import { ArchetypeQuizSection } from '../components/landing/ArchetypeQuizSection';
import { JournalTeaserSection } from '../components/landing/JournalTeaserSection';
import { WebinarTicketAd } from '../components/landing/WebinarTicketAd';
import { FreeVideoTeaser } from '../components/landing/FreeVideoTeaser';
import { FreeToolsSection } from '../components/landing/FreeToolsSection';
import { WladAuthoritySection } from '../components/landing/WladAuthoritySection';
import { LabSection } from '../components/landing/LabSection';
import { TrustProofSection } from '../components/landing/TrustProofSection';
import { WladKnowledgeInsideSection } from '../components/landing/WladKnowledgeInsideSection';
import { ClassesRoadmapSection } from '../components/landing/ClassesRoadmapSection';
import { PlatformValueSection } from '../components/landing/PlatformValueSection';
import { ManifestoSection } from '../components/landing/ManifestoSection';
import { CoachingWaitlist } from '../components/landing/CoachingWaitlist';
import { PricingLadder } from '../components/landing/PricingLadder';
import { OfferProofSection } from '../components/landing/OfferProofSection';
import { LicenseKeySection } from '../components/landing/LicenseKeySection';
import { AppointmentBookingSection } from '../components/landing/AppointmentBookingSection';
import { BenefitSection } from '../components/landing/BenefitSection';
import { AppPreviewSection } from '../components/landing/AppPreviewSection';
import { FAQSection } from '../components/landing/FAQSection';
import { FinalCTA } from '../components/landing/FinalCTA';
import { LandingFooter } from '../components/landing/LandingFooter';
import { ScrollProgressRail } from '../components/landing/ScrollProgressRail';
import { LeadCaptureModal } from '../components/landing/LeadCaptureModal';
import { LandingChatPod } from '../components/landing/LandingChatPod';
import { WladSignGuy } from '../components/landing/WladSignGuy';
import { LogoWall } from '../components/brand/LogoWall';
import { ThreeStepPath } from '../components/brand/ThreeStepPath';
import { capture } from '../lib/analytics';
import LeaderCheckLanding from './LeaderCheckLanding';
import { LANDING_BENEFITS, LANDING_META } from '../data/landingAssets';

// Host-Branch: leader-check.de bekommt die fokussierte Diagnostic-Landing.
// Subdomains (www., preview-*) zählen mit, lokale Dev-Hosts nicht.
const isLeaderCheckHost = () => {
  if (typeof window === 'undefined') return false;
  return /(^|\.)leader-check\.de$/i.test(window.location.hostname);
};

// App-Tier hosts (no hyphen). On these hosts the root `/` is the
// platform entry · unauthenticated visitors go straight to /login,
// signed-in visitors are already redirected to /dashboard by the
// `if (user)` check above. The marketing landing only lives on the
// Vercel hosts (with hyphen).
const isAppTierHost = () => {
  if (typeof window === 'undefined') return false;
  return /(^|\.)(leaderos\.de|leadercheck\.de)$/i.test(window.location.hostname);
};

/**
 * LandingPage · the public face of leader-os.de.
 *
 * Direction A LOCKED: Athletic Editorial × Heron-Preston specimen
 * sheets. Pure typography, zero external image dependency.
 *
 * Flow: Hero → How-It-Works (the explicit 3-step conversion path) →
 * 7 Benefits → Final CTA → Footer. Throughout: a sticky bottom
 * conversion band reminds the next step, exit-intent / 50%-scroll
 * triggers a lead-capture popup that lands the visitor on /thank-you.
 *
 * Auth-aware: signed-in users get bounced straight to /dashboard.
 */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // Custom-event bridge for cross-section "open chat" triggers
  // (FreeToolsSection's WladBot-Lite tool, future tools, share-targets…).
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onOpen = () => setChatOpen(true);
    window.addEventListener('leader-os:open-chat', onOpen);
    return () => window.removeEventListener('leader-os:open-chat', onOpen);
  }, []);

  useEffect(() => {
    document.title = LANDING_META.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', LANDING_META.description);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = LANDING_META.description;
      document.head.appendChild(m);
    }

    // Landing-Page läuft IMMER in Light-Mode · egal was der User in
    // localStorage hatte. Editorial-Direction A ist explizit weiß-auf-
    // dunkel-akzent, nicht das umgekehrte. Dashboard und App-Surfaces
    // dürfen weiterhin der Theme-Preference folgen.
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    if (wasDark) root.classList.remove('dark');
    return () => {
      if (wasDark) root.classList.add('dark');
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background" data-testid="landing-loading" />;
  }
  if (user) return <Navigate to="/dashboard" replace />;

  // App-Tier hosts (leaderos.de / leadercheck.de) · the platform entry,
  // not the marketing landing. Send unauthenticated visitors straight to
  // /login. The marketing pages live on the hyphen hosts on Vercel.
  if (isAppTierHost()) return <Navigate to="/login" replace />;

  // leader-check.de → fokussierte Diagnostic-Landing.
  // Gleicher CRA-Build, andere Identität, anderer Funnel-Zweck.
  if (isLeaderCheckHost()) return <LeaderCheckLanding />;

  return (
    <div className="bg-background text-foreground min-h-screen antialiased" data-testid="landing-page">
      <ClassScarcityBanner />
      <LandingNav />
      <ScrollProgressRail />

      <main id="main-content">
        {/* Trust-Aufbau in natürlicher Reihenfolge (CRO-Reorder Juli 2026):
            Results (WhatIs · "Ergebnisse statt Theorie")
              → Founder (WladIntroVideo · 30-Sek-Intro)
              → Produkt → CTA
              → Insights (JournalTeaser · Feldnotizen · ganz unten).
            VimeoIntroSection wurde entfernt: zweites ~30-Sek-Intro
            derselben Person auf derselben Seite war redundant, seit das
            Intro-Video direkt nach dem Hero-Block steht. */}
        <HeroSection />
        {/* Direkt unter dem ersten Screen: Referenz-Logos, Chrome-Hover */}
        <LogoWall />
        {/* Glasklare Abfolge: Check → Webinar → 14 Tage (WEBINAR_FUNNEL.md) */}
        <ThreeStepPath
          tone="dark"
          checkUrl="https://leadercheck.de?utm_source=leader-os&utm_medium=landing&utm_campaign=home-3-steps"
          onTrack={(e, p) => capture(`home_${e}`, p)}
        />
        <WhatIsLeaderOsSection />
        <WladIntroVideo />
        <SprintSpecimenStrip />
        <WladAuthoritySection />
        {/* Über uns · das Lab — Beweis-Sektion mit Swipe-Deck
            ("Wir liefern Ergebnisse, die Bestand haben.") */}
        <LabSection />
        <TrustProofSection />
        <WladKnowledgeInsideSection />
        <FreeVideoTeaser />
        <ArchetypeQuizSection />
        <FreeToolsSection />
        <PlatformValueSection />
        <ClassesRoadmapSection />
        <TrackFieldSection />
        <HowItWorksSection />
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-20">
          <WebinarTicketAd placement="landing-page" />
        </div>
        <ManifestoSection />

        {LANDING_BENEFITS.map((asset, idx) => (
          <BenefitSection
            key={asset.nr}
            asset={asset}
            index={idx}
            anchor={`benefit-${asset.nr}`}
            total={LANDING_BENEFITS.length}
          />
        ))}

        <AppPreviewSection />

        {/* MiniChallenge wandert weit nach unten · am Anfang konkurrierte
            sie mit dem Archetyp-Quiz. Hier nach AppPreview funktioniert sie
            als Re-Engagement-Beat: "ok du hast die Plattform gesehen,
            jetzt ein 60-Sekunden-Selbsttest bevor du auf Preise schaust." */}
        <MiniChallenge />

        <PricingLadder />
        <OfferProofSection />
        <LicenseKeySection />
        <AppointmentBookingSection />
        <CoachingWaitlist />
        <FAQSection />

        {/* Feldnotizen ganz ans Seitenende (Team-Entscheidung Juli 2026):
            das Journal ist Content-Discovery für Leser, die den ganzen
            Funnel durchgescrollt haben — nicht Teil der Conversion-Story.
            Hier hält es SEO-/Deep-Reader auf der Seite, ohne den Weg zum
            Pricing/Beratungs-CTA zu verlängern. */}
        <JournalTeaserSection />

        <FinalCTA />
      </main>

      <LandingFooter />

      {/* Lead-capture exit-intent popup · ConversionBand removed per
          editorial decision: the black sticky bottom bar competed with
          the WladSignGuy mascot and clipped content on mobile. */}
      <LeadCaptureModal />

      {/* Wlad-Sign-Guy (Pixel-Wlad mit Sign-Brett) rechts unten.
          Klick scrollt zur Mini-Challenge · der eigentliche Funnel-
          Entry-Point auf der Page. */}
      <WladSignGuy
        onOpen={() => {
          const target = document.getElementById('mini-challenge');
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else setChatOpen(true);
        }}
      />
      {chatOpen && <LandingChatPod mode="lead" />}
    </div>
  );
}
