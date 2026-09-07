import "@/App.css";
import { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "./components/ui/sonner";
import { NetworkStatusBanner } from "./components/shared/NetworkStatusBanner";
import { lazyWithRetry, clearChunkReloadGuard } from "./lib/lazyWithRetry";
import { captureAttribution } from "./lib/attribution";
import { stopAllAudio } from "./lib/audioBus";

// Iter 120: capture utm_*/gclid/referrer on every page load (first-touch safe)
captureAttribution();

// ── Eager routes ────────────────────────────────────────────────────────
// Login + Dashboard ship in the main bundle because they are the most-hit
// entry points and we never want to pay a chunk-load delay there.
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

// ── Lazy routes ─────────────────────────────────────────────────────────
// Iter 92.11: wrapped in `lazyWithRetry` — survives stale-deploy chunk-404s
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
const LearningVideosPage = lazyWithRetry(() => import("./pages/LearningVideosPage"));
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
const OnboardingPage = lazyWithRetry(() => import("./pages/OnboardingPage"));
const PaymentSuccessPage = lazyWithRetry(() => import("./pages/PaymentSuccessPage"));
const ReferralPage = lazyWithRetry(() => import("./pages/ReferralPage"));
const EnterprisePage = lazyWithRetry(() => import("./pages/EnterprisePage"));
const EnterpriseLandingPage = lazyWithRetry(() => import("./pages/EnterpriseLandingPage"));
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

import { WladMark } from "./components/brand/WladMark";
import { CookieConsent } from "./components/legal/CookieConsent";
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

  // Iter 92.11: once we successfully reach any route after a reload, clear
  // the chunk-reload guard so future deploys can retry-then-reload again.
  useEffect(() => {
    clearChunkReloadGuard();
    // Iter 121 (User feedback): kill ALL audio (TTS, ElevenLabs playback,
    // Browser-SpeechSynthesis) so voices don't bleed across routes.
    stopAllAudio('route-change');
  }, [location.pathname]);

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
        <Route path="/challengers" element={<ProtectedRoute><ChallengersPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/playbooks" element={<ProtectedRoute><PlaybooksPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/my-path" element={<ProtectedRoute><MyPathPage /></ProtectedRoute>} />
        <Route path="/lern-videos" element={<ProtectedRoute><LearningVideosPage /></ProtectedRoute>} />
        <Route path="/learning-videos" element={<Navigate to="/lern-videos" replace />} />
        {/* PUBLIC route — Mission Replay Showcase (no auth required) */}
        <Route path="/m/:slug" element={<SharedMissionPage />} />
        <Route path="/f/:slug" element={<SharedFolderPage />} />
        <Route path="/progress" element={<Navigate to="/community" replace />} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        {/* Admin route is intentionally hidden behind a non-guessable path. Backend require_admin() still gates all /api/admin/* */}
        <Route path="/wlad-control-x7k9q2" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/progress-old" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/coaching" element={<ProtectedRoute><CoachingPage /></ProtectedRoute>} />
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
        <Route path="/kurse" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
        <Route path="/kurse/:slug" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
        {/* Public legal pages — no auth required (GDPR / German law) */}
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/sicherheit" element={<TrustPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/widerruf" element={<WiderrufPage />} />
        <Route path="/agb" element={<AGBPage />} />
        {/* Public — opens via signed token in lifecycle drip emails */}
        <Route path="/email/unsubscribe" element={<EmailUnsubscribePage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
