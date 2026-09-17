import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowRight, Sparkles, Wrench } from 'lucide-react';
import { Button } from '../ui/button';

export const ToolsGrid = ({ tools, onSelectTool, onOpenDeepAssist, de }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-4 flex-wrap">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
        <Wrench size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-[200px]">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">GODMODE</h1>
        <p className="text-sm text-muted-foreground font-medium">{de ? 'Dein Werkzeugkasten für den Arbeitsalltag — Schritt für Schritt zum fertigen Ergebnis.' : 'Your toolbox for everyday work — step by step to a finished result.'}</p>
      </div>
      <Button
        onClick={onOpenDeepAssist}
        className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] hover:shadow-lg hover:shadow-[#BFFF00]/20 font-bold"
        data-testid="open-deep-assist-btn"
      >
        <Sparkles size={14} className="mr-1.5" /> {de ? 'KI Deep-Assist' : 'AI Deep Assist'}
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tools.map((t) => (
        <Card key={t.id}
          className="cursor-pointer hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-300 group border-black/[0.04] dark:border-white/[0.06]"
          onClick={() => onSelectTool(t)}
          data-testid={`tool-card-${t.id}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                <t.icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold mb-0.5">{t.title}</h3>
                <p className="text-[12px] text-muted-foreground">{t.desc}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[9px] font-semibold">{t.steps.length + 1} {de ? 'Schritte' : 'steps'}</Badge>
                  <span className="text-[10px] text-muted-foreground">~3 min</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
