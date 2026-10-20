// Trial quota banner for Free/Standard users (extracted from VideoChallengePage).
export const VideoTrialBanner = ({ trial, de = true }) => {
  if (!trial?.eligible) return null;
  return (
    <div
      className={`mb-5 rounded-2xl border px-4 py-3 flex items-center gap-3 ${trial.active ? 'bg-[#BFFF00]/10 border-[#BFFF00]/30' : 'bg-rose-500/5 border-rose-500/20'}`}
      data-testid="video-trial-banner"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${trial.active ? 'bg-[#BFFF00] text-[#0A0A0A]' : 'bg-rose-500/15 text-rose-500'}`}>
        <span className="text-[13px] font-black">{trial.remaining}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold leading-tight" data-testid="video-trial-headline">
          {trial.active
            ? (de
                ? `Du hast ${trial.remaining} von ${trial.total} kostenlosen Video-Analysen übrig`
                : `${trial.remaining} of ${trial.total} free video analyses remaining`)
            : (de
                ? 'Dein gratis Video-Analyse-Kontingent ist aufgebraucht'
                : 'Your free video analysis quota is used up')
          }
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {trial.active
            ? (de
                ? `Probier-Phase läuft noch ${trial.days_left} Tage — danach exklusiv im Leadership OS PLUS.`
                : `Trial ends in ${trial.days_left} days — then PLUS exclusive.`)
            : (de
                ? 'Upgrade auf Leadership OS PLUS für unbegrenzte Analysen.'
                : 'Upgrade to Leadership OS PLUS for unlimited analyses.')
          }
        </p>
      </div>
    </div>
  );
};
