import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import {
  ArrowRight, ArrowLeft, User, Briefcase, TrendingUp,
  Users, Target
} from 'lucide-react';

export const PersonaStep = ({ persona, setPersona, activeTool, personaComplete, onNext, de }) => (
  <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-black/[0.04] dark:border-white/[0.06] animate-fade-in">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Badge className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] border-0 text-[10px] font-bold">
          <User size={10} className="mr-1" /> {de ? 'DEIN PROFIL' : 'YOUR PROFILE'}
        </Badge>
      </div>
      <h3 className="text-lg font-bold">{de ? 'Erzähl uns über dich · für bessere Ergebnisse' : 'Tell us about yourself · for better results'}</h3>
      <p className="text-sm text-muted-foreground">{de ? 'Je mehr wir über dich wissen, desto personalisierter werden die Ergebnisse.' : 'The more we know, the more personalized the results.'}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
            <Briefcase size={12} /> {de ? 'Deine Rolle' : 'Your Role'} *
          </label>
          <Input value={persona.role} onChange={e => setPersona(p => ({ ...p, role: e.target.value }))}
            placeholder={de ? 'z.B. Team Lead, Manager, CEO...' : 'e.g. Team Lead, Manager, CEO...'}
            className="bg-gray-50 dark:bg-muted/30 border-black/[0.06]" data-testid="persona-role" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
            <TrendingUp size={12} /> {de ? 'Branche' : 'Industry'}
          </label>
          <Input value={persona.industry} onChange={e => setPersona(p => ({ ...p, industry: e.target.value }))}
            placeholder={de ? 'z.B. Tech, Finanzen, Gesundheit...' : 'e.g. Tech, Finance, Health...'}
            className="bg-gray-50 dark:bg-muted/30 border-black/[0.06]" data-testid="persona-industry" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
            <Users size={12} /> {de ? 'Teamgröße' : 'Team Size'}
          </label>
          <Input value={persona.team} onChange={e => setPersona(p => ({ ...p, team: e.target.value }))}
            placeholder={de ? 'z.B. 5 Mitarbeiter, 20 Personen...' : 'e.g. 5 direct reports, 20 people...'}
            className="bg-gray-50 dark:bg-muted/30 border-black/[0.06]" data-testid="persona-team" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
            <Target size={12} /> {de ? 'Deine persönlichen Ziele' : 'Your Personal Goals'}
          </label>
          <Input value={persona.goals} onChange={e => setPersona(p => ({ ...p, goals: e.target.value }))}
            placeholder={de ? 'z.B. Beförderung, bessere Kommunikation...' : 'e.g. Promotion, better communication...'}
            className="bg-gray-50 dark:bg-muted/30 border-black/[0.06]" data-testid="persona-goals" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
          <Users size={12} /> {de ? 'Ziele für deine Mitarbeiter' : 'Goals for Your Team'}
        </label>
        <Textarea value={persona.employeeGoals} onChange={e => setPersona(p => ({ ...p, employeeGoals: e.target.value }))}
          placeholder={de ? 'Was willst du für dein Team erreichen? Welche Entwicklung wünschst du dir für sie?' : 'What do you want to achieve for your team?'}
          rows={2} className="resize-none bg-gray-50 dark:bg-muted/30 border-black/[0.06]" data-testid="persona-employee-goals" />
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!personaComplete}
          className={`bg-gradient-to-r ${activeTool.gradient} text-white font-bold`} data-testid="persona-next-btn">
          {de ? 'Weiter zum Workflow' : 'Continue to Workflow'} <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const StepContent = ({ activeTool, currentStep, currentStepData, answers, setAnswers, isLastStep, loading, onPrev, onNext, onSubmit, de }) => (
  <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-black/[0.04] dark:border-white/[0.06] animate-fade-in" key={currentStep}>
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Badge className={`bg-gradient-to-r ${activeTool.gradient} text-white border-0 text-[10px] font-bold`}>
          {de ? 'Schritt' : 'Step'} {currentStep + 1} {de ? 'von' : 'of'} {activeTool.steps.length}
        </Badge>
      </div>
      <h3 className="text-lg font-bold">{currentStepData.q}</h3>

      {currentStepData.options && (
        <div className="grid grid-cols-2 gap-2">
          {currentStepData.options.map((opt, i) => (
            <button key={`opt-${opt.slice(0,15)}-${i}`}
              onClick={() => { setAnswers(prev => ({ ...prev, [currentStep]: opt })); if (currentStep < activeTool.steps.length - 1) setTimeout(onNext, 300); }}
              className={`p-3 rounded-xl text-sm font-medium text-left transition-all border ${
                answers[currentStep] === opt
                  ? 'bg-gradient-to-r from-[#BFFF00]/[0.04] to-[#BFFF00]/[0.06] dark:from-[#BFFF00]/[0.06] dark:to-[#BFFF00]/[0.04] border-sky-300 dark:border-sky-500/20 text-sky-700 dark:text-sky-400'
                  : 'bg-white dark:bg-card border-black/[0.06] dark:border-white/[0.06] hover:border-sky-200 dark:hover:border-sky-500/20 hover:bg-gray-50 dark:hover:bg-muted/30'
              }`} data-testid={`step-option-${i}`}>
              {answers[currentStep] === opt && <span className="inline mr-1.5 text-sky-500">&#10003;</span>}
              {opt}
            </button>
          ))}
        </div>
      )}

      {currentStepData.placeholder && (
        <Textarea value={answers[currentStep] || ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [currentStep]: e.target.value }))}
          placeholder={currentStepData.placeholder} rows={4}
          className="resize-none bg-gray-50 dark:bg-muted/30 border-black/[0.06] dark:border-white/[0.06] rounded-xl"
          data-testid="step-text-input" />
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onPrev} className="font-semibold">
          <ArrowLeft size={14} className="mr-1" /> {de ? 'Zurück' : 'Previous'}
        </Button>
        {isLastStep ? (
          <Button onClick={onSubmit} disabled={loading || !answers[currentStep]}
            className={`bg-gradient-to-r ${activeTool.gradient} text-white font-bold shadow-lg`} data-testid="workflow-submit-btn">
            {loading ? <>{de ? 'Wird analysiert...' : 'Analyzing...'}</> : <>{de ? 'Ergebnisse generieren' : 'Generate Results'}</>}
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!answers[currentStep]}
            className={`bg-gradient-to-r ${activeTool.gradient} text-white font-bold`} data-testid="step-next-btn">
            {de ? 'Weiter' : 'Next'} <ArrowRight size={14} className="ml-1" />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);
