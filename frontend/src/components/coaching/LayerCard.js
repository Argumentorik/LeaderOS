import { Card, CardContent } from '../ui/card';
import { CheckCircle2 } from 'lucide-react';

export const LayerCard = ({ number, title, description, features, gradient, icon: Icon }) => (
  <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-black/[0.05] dark:border-white/[0.06] overflow-hidden">
    <CardContent className="p-6 relative">
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${gradient})` }}
      />
      <div className="flex items-start gap-4 relative">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${gradient})` }}
        >
          <Icon size={22} className="text-white" />
        </div>
        {/* min-w-0 is critical: lets flex-child shrink so long words wrap instead of overflowing the card */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Bereich {number}</span>
          </div>
          <h3 className="text-lg font-black leading-tight break-words hyphens-auto" lang="de">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 break-words">{description}</p>
          <div className="mt-3 space-y-1.5">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                <span className="break-words">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
