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
const ChallengersPage = lazyWithRetry(() => import("./pages/ChallengersPage"));
const CoachingPage = lazyWithRetry(() => import("./pages/CoachingPage"));
const ToolsPage = lazyWithRetry(() => import("./pages/ToolsPage"));
const VideoChallengePage = lazyWithRetry(() => import("./pages/VideoChallengePage"));
const VideoArchivePage = lazyWithRetry(() => import("./pages/VideoArchivePage"));
const WladUniversePage = lazyWithRetry(() => import("./pages/WladUniversePage"));
const LeaderDiagnosePage = lazyWithRetry(() => import("./pages/LeaderDiagnosePage"));
const OnboardingPage = lazyWithRetry(() => import("./pages/OnboardingPage"));
const PaymentSuccessPage = lazyWithRetry(() => import("./pages/PaymentSuccessPage"));
const ReferralPage = lazyWithRetry(() => import("./pages/ReferralPage"));
const EnterprisePage = lazyWithRetry(() => import("./pages/EnterprisePage"));
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const SpecimenStudio = lazyWithRetry(() => import("./pages/SpecimenStudio"));
const AdStudio = lazyWithRetry(() => import("./pages/AdStudio"));
const StudioHub = lazyWithRetry(() => import("./pages/StudioHub"));
const SystemHealth = lazyWithRetry(() => import("./pages/SystemHealth"));
const ThankYouPage = lazyWithRetry(() => import("./pages/ThankYouPage"));
const WebinarThankYouPage = lazyWithRetry(() => import("./pages/WebinarThankYouPage"));
const WebinarLivePage = lazyWithRetry(() => import("./pages/WebinarLivePage"));
const Challenge30Page = lazyWithRetry(() => import("./pages/Challenge30Page"));
const DownloadsPage = lazyWithRetry(() => import("./pages/DownloadsPage"));
const ImpressumPage = lazyWithRetry(() => import("./pages/ImpressumPage"));
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
const FrameworksPage = lazyWithRetry(() => import("./pages/FrameworksPage"));
const FreeVideosPage = lazyWithRetry(() => import("./pages/FreeVideosPage"));
const NotFoundPage = lazyWithRetry(() => import("./pages/NotFoundPage"));
const ArticlePage = lazyWithRetry(() => import("./features/content/pages/ArticlePage"));
const LearningVideosPage = lazyWithRetry(() => import("./pages/LearningVideosPage"));
const FreeVideosMembersPage = lazyWithRetry(() => import("./pages/FreeVideosMembersPage"));
const LeaderOsSyncPage = lazyWithRetry(() => import("./pages/LeaderOsSyncPage"));
const SalesRoomPage = lazyWithRetry(() => import("./pages/SalesRoomPage"));
const SharedMissionPage = lazyWithRetry(() => import("./pages/SharedMissionPage"));
const SharedFolderPage = lazyWithRetry(() => import("./pages/SharedFolderPage"));

import { WladMark } from "./components/brand/WladMark";
import { FloatingWladBotDrawer } from "./components/shared/FloatingWladBotDrawer";
import { CookieConsent } from "./components/legal/CookieConsent";
import { ReAuthModal } from "./components/auth/ReAuthModal";
import { FakeWladCall } from "./components/calls/FakeWladCall";
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

  // Iter 92.11: once we successfully reach any route after a reload, clear
  // the chunk-reload guard so future deploys can retry-then-reload again.
  useEffect(() => {
    clearChunkReloadGuard();
  }, [location.pathname]);

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
        <Route path="/wlad-universe" element={<ProtectedRoute><WladUniversePage /></ProtectedRoute>} />
        <Route path="/leader-diagnose" element={<ProtectedRoute><LeaderDiagnosePage /></ProtectedRoute>} />
        <Route path="/video-challenge" element={<Navigate to="/missions" replace />} />
        <Route path="/challengers" element={<ProtectedRoute><ChallengersPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/playbooks" element={<ProtectedRoute><PlaybooksPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/my-path" element={<ProtectedRoute><MyPathPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/lern-videos" element={<ProtectedRoute><LearningVideosPage /></ProtectedRoute>} />
        <Route path="/free-videos" element={<ProtectedRoute><FreeVideosMembersPage /></ProtectedRoute>} />
        {/* Internal sales enablement room · login-gated, deliberately no
            sidebar entry — the URL is shared internally with the sales team. */}
        <Route path="/sales-room" element={<ProtectedRoute><SalesRoomPage /></ProtectedRoute>} />
        <Route path="/learning-videos" element={<Navigate to="/lern-videos" replace />} />
        {/* Admin route is intentionally hidden behind a non-guessable path. Backend require_admin() still gates all /api/admin/* */}
        <Route path="/wlad-control-x7k9q2" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/progress-old" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/coaching" element={<ProtectedRoute><CoachingPage /></ProtectedRoute>} />
        <Route path="/downloads" element={<ProtectedRoute><DownloadsPage /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        {/* /settings is a semantic alias of /profile. Users (and the testing
            agent in iter 91) expected /settings to resolve, not catch-all
            redirect to /dashboard. Keep this above the wildcard. */}
        <Route path="/settings" element={<Navigate to="/profile" replace />} />
        <Route path="/enterprise" element={<ProtectedRoute><EnterprisePage /></ProtectedRoute>} />
        <Route path="/challenge" element={<ProtectedRoute><Challenge30Page /></ProtectedRoute>} />
        {/* Public legal pages · no auth required (GDPR / German law) */}
        <Route path="/impressum" element={<ImpressumPage />} />
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
        {/* Public · ein Viewport, acht Frameworks (Kollektiva-Mechanik, Kanon-Inhalt) */}
        <Route path="/frameworks" element={<FrameworksPage />} />
        <Route path="/methodik" element={<Navigate to="/frameworks" replace />} />
        {/* Squeeze funnel for the free live webinar */}
        <Route path="/webinar" element={<WebinarPage />} />
        <Route path="/webinar/danke" element={<WebinarThankYouPage />} />
        {/* Waiting room · reminder emails (WEBINAR_JOIN_URL) point here */}
        <Route path="/webinar/live" element={<WebinarLivePage />} />
        {/* Ad-only · short-scroll, single-viewport variant, same 29.10. offer + register endpoint as /webinar and /event */}
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
        {/* Public share routes · read-only showcase, no auth required */}
        <Route path="/m/:slug" element={<SharedMissionPage />} />
        <Route path="/f/:slug" element={<SharedFolderPage />} />
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
