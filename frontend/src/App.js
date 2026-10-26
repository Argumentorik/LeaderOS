import "@/App.css";
import { Suspense, useEffect } from "react";
import { redirectAppRoutesToAppTier } from "@/lib/tierRedirect";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "./components/ui/sonner";
import { NetworkStatusBanner } from "./components/shared/NetworkStatusBanner";
import { lazyWithRetry, clearChunkReloadGuard } from "./lib/lazyWithRetry";
import { captureAttribution } from "./lib/attribution";
import { stopAllAudio } from "./lib/audioBus";
import { startPageLoad } from "./lib/pageLoadTelemetry";

// Iter 120: capture utm_*/gclid/referrer on every page load (first-touch safe)
captureAttribution();

// ── Eager routes ────────────────────────────────────────────────────────
// Login + Dashboard ship in the main bundle because they are the most-hit
// entry points and we never want to pay a chunk-load delay there.
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

// ── Lazy routes ─────────────────────────────────────────────────────────
// Iter 92.11: wrapped in `lazyWithRetry` · survives stale-deploy chunk-404s
// by transparently retrying then forcing a single reload to pick up the
// fresh index.html (and its new chunk hashes). See lib/lazyWithRetry.js.
const MagicLinkVerifyPage = lazyWithRetry(() => import("./pages/MagicLinkVerifyPage"));
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"));
const DailyCheckinPage = lazyWithRetry(() => import("./pages/DailyCheckinPage"));
const ChatPage = lazyWithRetry(() => import("./pages/ChatPage"));
const SimulationsPage = lazyWithRetry(() => import("./pages/SimulationsPage"));
const TasksPage = lazyWithRetry(() => import("./pages/TasksPage"));
const PlaybooksPage = lazyWithRetry(() => import("./pages/PlaybooksPage"));
const EventsPage = lazyWithRetry(() => import("./pages/EventsPage"));
const ProgressPage = lazyWithRetry(() => import("./pages/ProgressPage"));
const CommunityPage = lazyWithRetry(() => import("./pages/CommunityPage"));
const AdminPage = lazyWithRetry(() => import("./pages/AdminPage"));
const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));
const MyPathPage = lazyWithRetry(() => import("./pages/MyPathPage"));
const SharedMissionPage = lazyWithRetry(() => import("./pages/SharedMissionPage"));
const SharedFolderPage = lazyWithRetry(() => import("./pages/SharedFolderPage"));
const ChallengersPage = lazyWithRetry(() => import("./pages/ChallengersPage"));
const CoachingPage = lazyWithRetry(() => import("./pages/CoachingPage"));
const ToolsPage = lazyWithRetry(() => import("./pages/ToolsPage"));
const VideoChallengePage = lazyWithRetry(() => import("./pages/VideoChallengePage"));
const VideoArchivePage = lazyWithRetry(() => import("./pages/VideoArchivePage"));
// Iter 92.28 (Mert): WladUniversePage removed — feature deprecated, route now 410-redirects to /missions.
const LeaderDiagnosePage = lazyWithRetry(() => import("./pages/LeaderDiagnosePage"));
// Iter 92.29 (Mert): public Changelog drives curiosity & SEO ("build-in-public" surface).
const ChangelogPage = lazyWithRetry(() => import("./pages/ChangelogPage"));
const WhatIsWhatPage = lazyWithRetry(() => import("./pages/WhatIsWhatPage"));
const LabPage = lazyWithRetry(() => import("./pages/LabPage"));
const OnboardingPage = lazyWithRetry(() => import("./pages/OnboardingPage"));
const PaymentSuccessPage = lazyWithRetry(() => import("./pages/PaymentSuccessPage"));
const ReferralPage = lazyWithRetry(() => import("./pages/ReferralPage"));
const EnterprisePage = lazyWithRetry(() => import("./pages/EnterprisePage"));
const EnterpriseLandingPage = lazyWithRetry(() => import("./pages/EnterpriseLandingPage"));
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const SpecimenStudio = lazyWithRetry(() => import("./pages/SpecimenStudio"));
const AdStudio = lazyWithRetry(() => import("./pages/AdStudio"));
const StudioHub = lazyWithRetry(() => import("./pages/StudioHub"));
const SystemHealth = lazyWithRetry(() => import("./pages/SystemHealth"));
const ThankYouPage = lazyWithRetry(() => import("./pages/ThankYouPage"));
const WebinarThankYouPage = lazyWithRetry(() => import("./pages/WebinarThankYouPage"));
const WebinarLivePage = lazyWithRetry(() => import("./pages/WebinarLivePage"));
const Challenge30Page = lazyWithRetry(() => import("./pages/Challenge30Page"));
const VideoGuidePage = lazyWithRetry(() => import("./pages/VideoGuidePage"));
const CoursesPage = lazyWithRetry(() => import("./pages/CoursesPage"));
const CourseDetailPage = lazyWithRetry(() => import("./pages/CourseDetailPage"));
const DownloadsPage = lazyWithRetry(() => import("./pages/DownloadsPage"));
const ImpressumPage = lazyWithRetry(() => import("./pages/ImpressumPage"));
const TrustPage = lazyWithRetry(() => import("./pages/TrustPage"));
const DatenschutzPage = lazyWithRetry(() => import("./pages/DatenschutzPage"));
const WiderrufPage = lazyWithRetry(() => import("./pages/WiderrufPage"));
const AGBPage = lazyWithRetry(() => import("./pages/AGBPage"));
const EmailUnsubscribePage = lazyWithRetry(() => import("./pages/EmailUnsubscribePage"));
const NewsletterConfirmedPage = lazyWithRetry(() => import("./pages/NewsletterConfirmedPage"));
const JournalIndex = lazyWithRetry(() => import("./features/content/pages/JournalIndex"));
const WladJachtchenkoPage = lazyWithRetry(() => import("./pages/WladJachtchenkoPage"));
const EventPage = lazyWithRetry(() => import("./pages/EventPage"));
const WebinarPage = lazyWithRetry(() => import("./pages/WebinarPage"));
const TrainingLandingPage = lazyWithRetry(() => import("./pages/TrainingLandingPage"));
const KommunikationPage = lazyWithRetry(() => import("./pages/KommunikationPage"));
const KiFuehrungskraftPage = lazyWithRetry(() => import("./pages/KiFuehrungskraftPage"));
const LeaderOsTourPage = lazyWithRetry(() => import("./pages/LeaderOsTourPage"));
const FreeVideosPage = lazyWithRetry(() => import("./pages/FreeVideosPage"));
const NotFoundPage = lazyWithRetry(() => import("./pages/NotFoundPage"));
const ArticlePage = lazyWithRetry(() => import("./features/content/pages/ArticlePage"));
const FreeVideosMembersPage = lazyWithRetry(() => import("./pages/FreeVideosMembersPage"));
const LeaderOsSyncPage = lazyWithRetry(() => import("./pages/LeaderOsSyncPage"));
const SalesRoomPage = lazyWithRetry(() => import("./pages/SalesRoomPage"));

import { WladMark } from "./components/brand/WladMark";
import { registerRoutePreloads, prefetchIdleRoutes } from "./lib/routePrefetch";

registerRoutePreloads({
  '/chat': ChatPage, '/tools': ToolsPage, '/simulations': SimulationsPage, '/missions': VideoChallengePage,
  '/missions/archive': VideoArchivePage, '/challengers': ChallengersPage, '/tasks': TasksPage, '/playbooks': PlaybooksPage,
  '/events': EventsPage, '/my-path': MyPathPage, '/community': CommunityPage,
  '/coaching': CoachingPage, '/downloads': DownloadsPage, '/referral': ReferralPage, '/profile': ProfilePage,
  '/challenge': Challenge30Page, '/video-guide': VideoGuidePage, '/kurse': CoursesPage, '/kurse/:slug': CourseDetailPage,
  '/daily-checkin': DailyCheckinPage, '/leader-diagnose': LeaderDiagnosePage, '/enterprise': EnterprisePage,
  '/wlad-control-x7k9q2': AdminPage,
});
import { CookieConsent } from "./components/legal/CookieConsent";
import { trackGoogleAdsPageView } from "./lib/googleAds";
import { trackBingPageView } from "./lib/bingUet";
import { ReAuthModal } from "./components/auth/ReAuthModal";
import { FakeWladCall } from "./components/calls/FakeWladCall";
import { WladHelpButton } from "./components/support/WladHelpButton";
import { UsageFeedbackPrompt } from "./components/support/UsageFeedbackPrompt";
import { FloatingWladBotDrawer } from "./components/shared/FloatingWladBotDrawer";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

import { CreditProvider } from "./contexts/CreditContext";
import { PricingProvider } from "./contexts/PricingContext";
import { TierProvider } from "./contexts/TierContext";

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse-glow rounded-xl">
      <WladMark size={48} animated />
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function AppRouter() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => { if (user) prefetchIdleRoutes(); }, [user]);

  // Iter 92.11: once we successfully reach any route after a reload, clear
  // the chunk-reload guard so future deploys can retry-then-reload again.
  useEffect(() => {
    clearChunkReloadGuard();
    // Iter 121 (User feedback): kill ALL audio (TTS, ElevenLabs playback,
    // Browser-SpeechSynthesis) so voices don't bleed across routes.
    stopAllAudio('route-change');
    // Iter 168: Ladezeit je Seite messen (Admin → Ladezeiten)
    startPageLoad(location.pathname);
  }, [location.pathname]);

  // Ad-Tags: SPA-Routenwechsel als Pageview melden (Google Ads zählt die
  // Conversion „webinar_signup" über den Pageview /webinar/danke). Beide
  // Funktionen sind no-ops, solange die IDs nicht gesetzt sind.
  useEffect(() => {
    const path = location.pathname + location.search;
    trackGoogleAdsPageView(path);
    trackBingPageView(path);
  }, [location.pathname, location.search]);

  // Cross-tier guard · belt-and-suspenders for in-SPA navigation.
  // The synchronous pass in index.js handles initial page loads (typed URL,
  // bookmark, browser autocomplete). This useEffect catches the edge case
  // where a Link or programmatic navigate() lands on an App route while
  // the user is still on the Landing host. Same helper, same allowlist,
  // so the two layers can never disagree.
  useEffect(() => {
    redirectAppRoutesToAppTier();
  }, [location.pathname, location.search, location.hash]);

  // Scroll-to-top on every pathname change. We skip when the URL has a
  // hash (in-page anchor like /#pricing or /journal/foo#section) so
  // anchor-driven scrolls keep landing on their target. Without this,
  // navigating /journal/a → /journal/b preserves the previous article's
  // scroll position — confusing UX, especially on long reads.
  useEffect(() => {
    if (location.hash) return;
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on pathname change; hash is read, not a trigger
  }, [location.pathname]);

  // Smooth-scroll to in-page anchors (/#beratung, /#pricing, …).
  // React Router performs no native hash jump on SPA navigation, and the
  // landing sections are lazy/suspense-mounted — the target id may not be
  // in the DOM yet on the first frame. Retry briefly (up to ~4s) so the
  // nav CTA reliably lands on the Beratung section without layout shifts.
  // location.key is in the deps so clicking the same anchor twice re-fires.
  useEffect(() => {
    if (!location.hash || typeof window === 'undefined') return undefined;
    if (location.hash.includes('session_id=')) return undefined; // auth callback, not an anchor
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return undefined;
    let tries = 0;
    let timer;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (tries++ < 40) timer = window.setTimeout(attempt, 100);
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash, location.key]);

  if (location.hash?.includes('session_id=')) {
    return (
      <Suspense fallback={<RouteLoader />}>
        <AuthCallback />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Iter 92.25: explicit /signup + /register routes so deep-links from
            SharedFolderPage, marketing campaigns, and the leadercheck.de funnel
            land on the form in REGISTER mode (not the default login mode). */}
        <Route path="/signup" element={<LoginPage initialMode="register" />} />
        <Route path="/register" element={<LoginPage initialMode="register" />} />
        <Route path="/auth/magic" element={<MagicLinkVerifyPage />} />
        <Route path="/auth/sync" element={<LeaderOsSyncPage />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/daily-checkin" element={<ProtectedRoute><DailyCheckinPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
        <Route path="/simulations" element={<ProtectedRoute><SimulationsPage /></ProtectedRoute>} />
        <Route path="/missions" element={<ProtectedRoute><VideoChallengePage /></ProtectedRoute>} />
        <Route path="/missions/archive" element={<ProtectedRoute><VideoArchivePage /></ProtectedRoute>} />
        {/* Iter 92.28 (Mert): /wlad-universe deprecated → permanent redirect to /missions
            (Wlad-grounded video-coaching surface, same intent). */}
        <Route path="/wlad-universe" element={<Navigate to="/missions" replace />} />
        <Route path="/leader-diagnose" element={<ProtectedRoute><LeaderDiagnosePage /></ProtectedRoute>} />
        {/* Iter 92.29: public changelog — no auth, indexable, build-in-public */}
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/whats-new" element={<Navigate to="/changelog" replace />} />
        <Route path="/video-challenge" element={<Navigate to="/missions" replace />} />
        {/* Iter 182: Video-Analyse wohnt im Video-Studio — Direktlinks landen dort statt im Nirgendwo. */}
        <Route path="/video-analyse" element={<Navigate to="/missions" replace />} />
        <Route path="/video-analysis" element={<Navigate to="/missions" replace />} />
        <Route path="/challengers" element={<ProtectedRoute><ChallengersPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/playbooks" element={<ProtectedRoute><PlaybooksPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/my-path" element={<ProtectedRoute><MyPathPage /></ProtectedRoute>} />
        <Route path="/lern-videos" element={<Navigate to="/kurse" replace />} />
        <Route path="/learning-videos" element={<Navigate to="/kurse" replace />} />
        {/* PUBLIC route — Mission Replay Showcase (no auth required) */}
        <Route path="/m/:slug" element={<SharedMissionPage />} />
        <Route path="/f/:slug" element={<SharedFolderPage />} />
        <Route path="/progress" element={<Navigate to="/community" replace />} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/free-videos" element={<ProtectedRoute><FreeVideosMembersPage /></ProtectedRoute>} />
        {/* Internal sales enablement room · login-gated, deliberately no
            sidebar entry — the URL is shared internally with the sales team. */}
        <Route path="/sales-room" element={<ProtectedRoute><SalesRoomPage /></ProtectedRoute>} />
        {/* Admin route is intentionally hidden behind a non-guessable path. Backend require_admin() still gates all /api/admin/* */}
        <Route path="/wlad-control-x7k9q2" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/progress-old" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        {/* Iter 185: Verkaufsseite ohne Login erreichbar (Suche + KI-Empfehlungen).
            Alte Adresse bleibt gültig und leitet weiter. */}
        <Route path="/leadership-programm" element={<CoachingPage />} />
        {/* Leadership LAB: öffentlich erreichbar wie das Leadership-Programm (Iter 186) */}
        <Route path="/leadership-lab" element={<LabPage />} />
        <Route path="/coaching" element={<Navigate to="/leadership-programm" replace />} />
        <Route path="/was-ist-was" element={<ProtectedRoute><WhatIsWhatPage /></ProtectedRoute>} />
        <Route path="/downloads" element={<ProtectedRoute><DownloadsPage /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
        <Route path="/referrals" element={<Navigate to="/referral" replace />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        {/* /settings is a semantic alias of /profile. Users (and the testing
            agent in iter 91) expected /settings to resolve, not catch-all
            redirect to /dashboard. Keep this above the wildcard. */}
        <Route path="/settings" element={<Navigate to="/profile" replace />} />
        <Route path="/enterprise" element={<ProtectedRoute><EnterprisePage /></ProtectedRoute>} />
        {/* Iter 128: public marketing surface for the Enterprise funnel.
            No auth — captures CEO/team leads via /api/enterprise/public-lead. */}
        <Route path="/for-teams" element={<EnterpriseLandingPage />} />
        <Route path="/teams" element={<Navigate to="/for-teams" replace />} />
        <Route path="/business" element={<Navigate to="/for-teams" replace />} />
        <Route path="/challenge" element={<ProtectedRoute><Challenge30Page /></ProtectedRoute>} />
        <Route path="/video-guide" element={<ProtectedRoute><VideoGuidePage /></ProtectedRoute>} />
        {/* Plan Iter 187: Der Studienplan ist öffentlich — Folge 1 ohne Konto. */}
        <Route path="/kurse" element={<CoursesPage />} />
        <Route path="/kurse/:slug" element={<CourseDetailPage />} />
        {/* Public legal pages — no auth required (GDPR / German law) */}
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/sicherheit" element={<TrustPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/widerruf" element={<WiderrufPage />} />
        <Route path="/agb" element={<AGBPage />} />
        {/* Public · opens via signed token in lifecycle drip emails */}
        <Route path="/email/unsubscribe" element={<EmailUnsubscribePage />} />
        {/* Public · double-opt-in confirmation landing (newsletter-confirm fn redirects here) */}
        <Route path="/newsletter/confirmed" element={<NewsletterConfirmedPage />} />
        {/* Public · Feldnotizen / content engine */}
        <Route path="/journal" element={<JournalIndex />} />
        <Route path="/journal/:slug" element={<ArticlePage />} />
        {/* Canonical SERP-winner for "Wlad Jachtchenko" searches · public, no auth */}
        <Route path="/wlad-jachtchenko" element={<WladJachtchenkoPage />} />
        {/* Public · dated free launch event · high-conversion signup */}
        <Route path="/event" element={<EventPage />} />
        <Route path="/live" element={<Navigate to="/event" replace />} />
        {/* Seite entfernt · bestehende Ad-Links landen auf der Haupt-Ad-Landing */}
        <Route path="/frameworks" element={<Navigate to="/kommunikation" replace />} />
        <Route path="/methodik" element={<Navigate to="/kommunikation" replace />} />
        {/* Squeeze funnel for the free live webinar */}
        <Route path="/webinar" element={<WebinarPage />} />
        <Route path="/webinar/danke" element={<WebinarThankYouPage />} />
        {/* Waiting room · reminder emails (WEBINAR_JOIN_URL) point here */}
        <Route path="/webinar/live" element={<WebinarLivePage />} />
        {/* Ad-only · short-scroll, single-viewport variant, same 26.11. offer + register endpoint as /webinar and /event */}
        <Route path="/training" element={<TrainingLandingPage />} />
        {/* Ad-only · Kommunikation-first, Steadyflow-Mechanik mit Kanon-Inhalt (zehn Frameworks als Marquee) */}
        <Route path="/kommunikation" element={<KommunikationPage />} />
        {/* Kampagnen-Landing + SEO-Pillar „KI-Führungskraft" · 6 Kampagnen via ?k= · prerendert (scripts/prerender-landings.mjs) */}
        <Route path="/ki-fuehrungskraft" element={<KiFuehrungskraftPage />} />
        <Route path="/leaderos" element={<LeaderOsTourPage />} />
        {/* Public · free 4-video lead-magnet funnel · "Führung beginnt hier" */}
        <Route path="/fuehrung-beginnt-hier" element={<FreeVideosPage />} />
        <Route path="/gratis" element={<Navigate to="/fuehrung-beginnt-hier" replace />} />
        <Route path="/free" element={<Navigate to="/fuehrung-beginnt-hier" replace />} />
        <Route path="/videos" element={<Navigate to="/fuehrung-beginnt-hier" replace />} />
        <Route path="/wlad" element={<Navigate to="/wlad-jachtchenko" replace />} />
        <Route path="/about" element={<Navigate to="/wlad-jachtchenko" replace />} />
        <Route path="/ueber-wlad" element={<Navigate to="/wlad-jachtchenko" replace />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/studio" element={<StudioHub />} />
        <Route path="/specimens" element={<SpecimenStudio />} />
        <Route path="/ads" element={<AdStudio />} />
        <Route path="/system" element={<SystemHealth />} />
        <Route path="/thank-you" element={<ThankYouPage />} />

        {/* Legacy aliases for the free-video funnel · canonical page is
            /fuehrung-beginnt-hier (see routes above with /gratis, /free, /videos). */}
        <Route path="/gratis-videos" element={<Navigate to="/fuehrung-beginnt-hier" replace />} />
        <Route path="/free-video-series" element={<Navigate to="/fuehrung-beginnt-hier" replace />} />
        {/* Branded 404 instead of silent Navigate-to-/ · lets Search
            Console flag broken external backlinks and gives users a
            "did you mean" surface with the 5 highest-intent destinations. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CreditProvider>
              <TierProvider>
                <PricingProvider>
                  <BrowserRouter>
                    {/* Skip-to-content · WCAG 2.4.1 · visually hidden until
                        keyboard-focused, then jumps a keyboard/screen-reader
                        user past the nav straight into the page content. */}
                    <a
                      href="#main-content"
                      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:font-bold focus:text-sm focus:rounded-none focus:outline-none focus:ring-4 focus:ring-brand"
                    >
                      Zum Inhalt springen
                    </a>
                    <NetworkStatusBanner />
                    <AppRouter />
                    <FakeWladCall />
                    <WladHelpButton />
                    <UsageFeedbackPrompt />
                    <FloatingWladBotDrawer />
                    <Toaster position="bottom-right" />
                    <CookieConsent />
                    <ReAuthModal />
                  </BrowserRouter>
                </PricingProvider>
              </TierProvider>
            </CreditProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
