import LeaderOSLogo from "../LeaderOSLogo";

/**
 * HeroFooter — minimal landing footer.
 */
export default function HeroFooter() {
  return (
    <footer className="border-t border-white/[0.04] py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LeaderOSLogo variant="default" size="md" />
            <span className="text-slate-700">|</span>
            <span className="font-inter text-sm text-slate-500">Leadership Diagnose</span>
          </div>
          <div className="font-inter text-sm text-slate-600">
            2026 Leader OS. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </footer>
  );
}
