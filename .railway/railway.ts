import { database, defineRailway, github, preserve, project, service, volume, type VariableValue } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "LeaderOS";

// EU West (Amsterdam) — closest Railway region to Supabase eu-north-1.
const REGION = "europe-west4-drams3a";

export default defineRailway((ctx) => {
  const staging = ctx.isEnvironment("staging");

  // mongo() pins mongo:8, which won't start on Linux kernels >= 6.19. Same
  // resource, older image. (Staging FCV was lowered to 7.0 before the switch.)
  const db = database("MongoDB", "mongo", { image: "mongo:7", output: "MONGO_URL", defaultMountPath: "/data/db", region: REGION });

  // Disk cache for guide media + chunked admin uploads (TMPDIR below).
  // Volumes pin the service to 1 replica, which challenge_mail_loop needs anyway.
  const data = volume("backend-data", { region: REGION, sizeMB: 50000 });

  // Secret values live in Railway, never in this file: preserve() keeps
  // whatever is set via `railway variable set`. Staging deliberately has no
  // Resend key and no Supabase write access, so the copy can't email or write
  // leads into production systems. STRIPE_API_KEY is per environment:
  // sk_live_ in production, sk_test_ in staging.
  const prodOnlySecrets: Record<string, VariableValue> = staging
    ? {}
    : {
        RESEND_API_KEY: preserve(),
        SUPABASE_ANON_KEY: preserve(),
        SUPABASE_SERVICE_KEY: preserve(),
        SUPABASE_OUTBOUND_SECRET: preserve(),
        SUPABASE_USER_MIRROR_URL: preserve(),
      };

  const LeaderOS = service("LeaderOS", {
    source: github("Argumentorik/LeaderOS", { branch: "railway-base", checkSuites: false }),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "backend/Dockerfile", watchPatterns: ["/backend/**"] },
    healthcheck: "/api/health",
    healthcheckTimeout: 300,
    replicas: { [REGION]: 1 },
    networking: { privateNetworkEndpoint: "leaderos" },
    volumeMounts: { "/data": data },
    env: {
      // Fixed so LeaderOS-web can proxy to leaderos.railway.internal:8001.
      PORT: "8001",
      MONGO_URL: db.env.MONGO_URL,
      DB_NAME: "leadership_os",
      TMPDIR: "/data/tmp",
      ENV: staging ? "staging" : "production",
      SENTRY_ENV: staging ? "staging" : "production",
      // Email links, Stripe return URLs etc. — code defaults to leaderos.de.
      FRONTEND_BASE_URL: staging ? "https://leaderos-web-staging.up.railway.app" : "https://leaderos.de",
      // server.py refuses to boot with ENV=production and no explicit whitelist.
      CORS_ORIGINS: staging
        ? "*"
        : "https://leaderos.de,https://www.leaderos.de,https://leader-os.de,https://www.leader-os.de,https://leadercheck.de,https://www.leadercheck.de,https://leader-check.de,https://www.leader-check.de",

      // Per-environment secrets (staging gets its own JWT/cron/sync secrets).
      JWT_SECRET: preserve(),
      CRON_SHARED_SECRET: preserve(),
      INBOUND_SYNC_SECRET: preserve(),

      // LLM: Anthropic only (lib/llm_provider.py). Opus by default, Haiku for the classifier.
      ANTHROPIC_API_KEY: preserve(),

      // Shared provider config, copied from the Emergent production env.
      // EMERGENT_LLM_KEY still backs the objstore (lib/object_storage) until the files move.
      // FAL (image/video generation) is off until a FAL_KEY is set.
      EMERGENT_LLM_KEY: preserve(),
      INTEGRATION_PROXY_URL: preserve(),
      OAUTH_SESSION_URL: preserve(),
      GOOGLE_CLIENT_ID: preserve(),
      ELEVENLABS_API_KEY: preserve(),
      ELEVENLABS_API_KEY_ID: preserve(),
      ELEVENLABS_WLAD_VOICE_ID: preserve(),
      MINIMAX_WLAD_VOICE_ID: preserve(),
      SENTRY_DSN: preserve(),
      SENDER_EMAIL: preserve(),
      SUPABASE_URL: preserve(),
      PUBLIC_BASE_URL: preserve(),
      WEBINAR_JOIN_URL: preserve(),
      TRUSTED_PROXY_HOPS: preserve(),
      // Verifies Leader-Check's sync tokens; must equal LeaderCheck's value.
      REPORT_JWT_SECRET: preserve(),
      STRIPE_API_KEY: preserve(),

      ...prodOnlySecrets,
    },
  });

  // Ad/analytics IDs are baked into the build. Staging builds without them so
  // soak traffic never reaches the ad platforms or production analytics.
  const prodOnlyWebIds: Record<string, VariableValue> = staging
    ? {}
    : {
        REACT_APP_POSTHOG_KEY: preserve(),
        REACT_APP_POSTHOG_HOST: preserve(),
        REACT_APP_SENTRY_DSN_LEADER_OS: preserve(),
        REACT_APP_META_PIXEL_ID: preserve(),
        REACT_APP_LINKEDIN_PARTNER_ID: preserve(),
        REACT_APP_LINKEDIN_LEAD_CONVERSION_ID: preserve(),
        REACT_APP_GOOGLE_ADS_ID: preserve(),
        REACT_APP_GOOGLE_ADS_WEBINAR_LABEL: preserve(),
        REACT_APP_BING_UET_ID: preserve(),
      };

  // CRA build served by Caddy, which proxies /api/* to LeaderOS over the
  // private network — same origin for the app, as on Emergent (frontend/Caddyfile).
  const LeaderOSWeb = service("LeaderOS-web", {
    source: github("Argumentorik/LeaderOS", { branch: "railway-base", checkSuites: false }),
    rootDirectory: "frontend",
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile", watchPatterns: ["/frontend/**"] },
    healthcheck: "/",
    replicas: { [REGION]: 1 },
    networking: { privateNetworkEndpoint: "leaderos-web" },
    env: {
      BACKEND_URL: "http://leaderos.railway.internal:8001",
      REACT_APP_SENTRY_ENV: staging ? "staging" : "production",
      ...prodOnlyWebIds,
    },
  });

  // --- Leader-Check (leadercheck.de) — separate app in leadercheck/, own DB on
  // the same Mongo server. Same backend + Caddy layout as LeaderOS.
  const leaderCheckProdSecrets: Record<string, VariableValue> = staging
    ? {}
    : {
        RESEND_API_KEY: preserve(),
      };

  const LeaderCheck = service("LeaderCheck", {
    source: github("Argumentorik/LeaderOS", { branch: "railway-base", checkSuites: false }),
    rootDirectory: "leadercheck/backend",
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile", watchPatterns: ["/leadercheck/backend/**"] },
    healthcheck: "/api/",
    // Email drip scheduler + Stripe self-healing loop run in-process: 1 replica.
    replicas: { [REGION]: 1 },
    networking: { privateNetworkEndpoint: "leadercheck" },
    env: {
      PORT: "8001",
      MONGO_URL: db.env.MONGO_URL,
      DB_NAME: "leadercheck",
      CORS_ORIGINS: staging
        ? "https://leadercheck-web-staging.up.railway.app"
        : "https://leadercheck.de,https://www.leadercheck.de",
      SENDER_EMAIL: "wlad@leaderos.de",
      // Quiz narrative + coach chat (services/llm.py); same key as LeaderOS.
      ANTHROPIC_API_KEY: "${{LeaderOS.ANTHROPIC_API_KEY}}",
      // Paid checkout -> LeaderOS account + tier (services/leaderos_sync.py),
      // over the private network with LeaderOS's inbound sync secret.
      LEADEROS_SYNC_URL: "http://leaderos.railway.internal:8001",
      LEADEROS_SYNC_SECRET: "${{LeaderOS.INBOUND_SYNC_SECRET}}",

      ADMIN_JWT_SECRET: preserve(),
      ADMIN_PASSWORD: preserve(),
      REPORT_JWT_SECRET: preserve(),
      // Per environment: live key + live webhook in production, Stripe test
      // mode (own test webhook endpoint) in staging.
      STRIPE_API_KEY: preserve(),
      STRIPE_WEBHOOK_SECRET: preserve(),

      ...leaderCheckProdSecrets,
    },
  });

  const LeaderCheckWeb = service("LeaderCheck-web", {
    source: github("Argumentorik/LeaderOS", { branch: "railway-base", checkSuites: false }),
    rootDirectory: "leadercheck/frontend",
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile", watchPatterns: ["/leadercheck/frontend/**"] },
    healthcheck: "/",
    replicas: { [REGION]: 1 },
    networking: { privateNetworkEndpoint: "leadercheck-web" },
    env: {
      BACKEND_URL: "http://leadercheck.railway.internal:8001",
    },
  });

  return project("leaderos", {
    variables: { managed: true },
    resources: [LeaderOS, db, data, LeaderOSWeb, LeaderCheck, LeaderCheckWeb],
  });
});
