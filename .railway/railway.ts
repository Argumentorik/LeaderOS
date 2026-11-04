import { defineRailway, github, mongo, preserve, project, service, volume } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "LeaderOS";

// EU West (Amsterdam) — closest Railway region to Supabase eu-north-1.
const REGION = "europe-west4-drams3a";

export default defineRailway((ctx) => {
  const staging = ctx.isEnvironment("staging");

  const db = mongo("MongoDB", { region: REGION });

  // Disk cache for guide media + chunked admin uploads (TMPDIR below).
  // Volumes pin the service to 1 replica, which challenge_mail_loop needs anyway.
  const data = volume("backend-data", { region: REGION, sizeMB: 50000 });

  // Secret values live in Railway, never in this file: preserve() keeps
  // whatever is set via `railway variable set`. Staging deliberately has no
  // live Stripe/Resend keys and no Supabase write access, so the copy can't
  // charge, email or write leads into production systems.
  const prodOnlySecrets = staging
    ? {}
    : {
        STRIPE_API_KEY: preserve(),
        RESEND_API_KEY: preserve(),
        SUPABASE_ANON_KEY: preserve(),
        SUPABASE_SERVICE_KEY: preserve(),
        SUPABASE_OUTBOUND_SECRET: preserve(),
        SUPABASE_USER_MIRROR_URL: preserve(),
      };

  const LeaderOS = service("LeaderOS", {
    source: github("Argumentorik/LeaderOS", { branch: "railway-base", checkSuites: false }),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "backend/Dockerfile", watchPatterns: ["backend/**"] },
    healthcheck: "/api/health",
    healthcheckTimeout: 300,
    replicas: { [REGION]: 1 },
    networking: { privateNetworkEndpoint: "leaderos" },
    volumeMounts: { "/data": data },
    env: {
      MONGO_URL: db.env.MONGO_URL,
      DB_NAME: "leadership_os",
      TMPDIR: "/data/tmp",
      ENV: staging ? "staging" : "production",
      SENTRY_ENV: staging ? "staging" : "production",
      // server.py refuses to boot with ENV=production and no explicit whitelist.
      CORS_ORIGINS: staging
        ? "*"
        : "https://leaderos.de,https://www.leaderos.de,https://leader-os.de,https://www.leader-os.de,https://leadercheck.de,https://www.leadercheck.de,https://leader-check.de,https://www.leader-check.de",

      // Per-environment secrets (staging gets its own JWT/cron/sync secrets).
      JWT_SECRET: preserve(),
      CRON_SHARED_SECRET: preserve(),
      INBOUND_SYNC_SECRET: preserve(),

      // Shared provider config, copied from the Emergent production env.
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

      ...prodOnlySecrets,
    },
  });

  return project("leaderos", {
    variables: { managed: true },
    resources: [LeaderOS, db, data],
  });
});
