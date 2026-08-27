import { useState, useEffect, useCallback } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import { ListChecks, Plus, Trash2, Sparkles, Target, CheckCircle2, Clock, Quote, CalendarDays, ArrowRight, Flame, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const QUOTES = [
  { q: 'Wer Menschen bewegen will, muss zuerst sich selbst bewegen.', a: 'Wlad Jachtchenko' },
  { q: 'The task of leadership is not to put greatness into people, but to elicit it.', a: 'John Buchan' },
  { q: 'Kommunikation ist die wichtigste Führungsqualität. Punkt.', a: 'Wlad Jachtchenko' },
  { q: 'Before you are a leader, success is about growing yourself.', a: 'Jack Welch' },
];

export default function TasksPage() {
  const { lang } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', category: 'general', due_date: '' });
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [generating, setGenerating] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Iter 139: Aufgabentexte waren abgeschnitten und nicht öffenbar.
  const [expandedTask, setExpandedTask] = useState(null);

  const loadTasks = useCallback(async () => {
    try { const res = await api.get('/tasks'); setTasks(res.data); } catch (err) { logger.error(err); }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await api.post('/tasks', newTask);
      setNewTask({ title: '', description: '', priority: 'medium', category: 'general', due_date: '' });
      setShowDialog(false);
      loadTasks();
    } catch (err) { logger.error(err); }
  };

  const toggleTask = async (task) => {
    try { await api.put(`/tasks/${task.task_id}`, { status: task.status === 'completed' ? 'pending' : 'completed' }); loadTasks(); } catch (err) { logger.error(err); }
  };

  const deleteTask = async (taskId) => {
    try { await api.delete(`/tasks/${taskId}`); loadTasks(); } catch (err) { logger.error(err); }
  };

  const generateAiTasks = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await api.post('/tasks/generate');
      toast.success(lang === 'de' ? `${res.data.created} KI-Aufgaben von WladBot erstellt` : `${res.data.created} AI tasks created by WladBot`);
      loadTasks();
    } catch (err) {
      logger.error(err);
      toast.error(err.response?.data?.detail || (lang === 'de' ? 'Generierung fehlgeschlagen' : 'Generation failed'));
    } finally { setGenerating(false); }
  };

  // "Heute im Fokus" — top 3 open tasks: high priority first, then nearest due date
  const PRIO_ORDER = { high: 0, medium: 1, low: 2 };
  const focusTasks = [...tasks.filter(t => t.status === 'pending')]
    .sort((a, b) => (PRIO_ORDER[a.priority] ?? 1) - (PRIO_ORDER[b.priority] ?? 1) || (a.due_date || '9999').localeCompare(b.due_date || '9999'))
    .slice(0, 3);
  const focusIds = new Set(focusTasks.map(t => t.task_id));

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);
  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');
  const aiTasks = tasks.filter(t => t.source === 'ai_coach');
  const priorityColor = (p) => p === 'high' ? 'border-red-400/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10' : p === 'low' ? 'border-green-400/30 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10' : 'border-amber-400/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10';
  const priorityLabel = (p) => p === 'high' ? (lang === 'de' ? 'Hoch' : 'High') : p === 'low' ? (lang === 'de' ? 'Niedrig' : 'Low') : (lang === 'de' ? 'Mittel' : 'Medium');

  /* ── Right Panel: Timeline + Goals ── */
  const RightPanel = () => (
    <div className="p-5 space-y-5">
      {/* Quote */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/[0.04] dark:to-[#BFFF00]/[0.03] border border-[#BFFF00]/20 dark:border-[#BFFF00]/15">
        <Quote size={14} className="text-[#BFFF00] mb-2" />
        <p className="text-[12px] italic leading-relaxed text-foreground dark:text-foreground/80">"{quote.q}"</p>
        <p className="text-[10px] text-[#6B8A00] dark:text-[#BFFF00] mt-1.5 font-semibold">— {quote.a}</p>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{lang === 'de' ? 'Übersicht' : 'Overview'}</h3>
        <div className="space-y-2">
          {[
            { icon: Target, label: lang === 'de' ? 'Offen' : 'Open', val: pending.length, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10 dark:bg-sky-50 dark:bg-sky-500/100/10' },
            { icon: CheckCircle2, label: lang === 'de' ? 'Erledigt' : 'Done', val: completed.length, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
            { icon: Sparkles, label: lang === 'de' ? 'KI-generiert' : 'AI Generated', val: aiTasks.length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-[#7B3FE4]/10' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.bg}`}>
              <s.icon size={16} className={s.color} />
              <div className="flex-1"><p className="text-[11px] text-muted-foreground font-medium">{s.label}</p></div>
              <span className="text-lg font-bold">{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{lang === 'de' ? 'Timeline' : 'Timeline'}</h3>
        <div className="space-y-0.5">
          {pending.slice(0, 6).map((task, i) => (
            <div key={task.task_id} className="flex items-start gap-2.5 group">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] animate-pulse' : 'bg-gray-200 dark:bg-muted/50'}`} />
                {i < Math.min(pending.length - 1, 5) && <div className="w-[1.5px] h-8 bg-gray-200 dark:bg-muted/30" />}
              </div>
              <div className="pb-3 flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate leading-tight">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 ${priorityColor(task.priority)}`}>{priorityLabel(task.priority)}</Badge>
                  {task.due_date && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><CalendarDays size={8} />{new Date(task.due_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">{lang === 'de' ? 'Keine offenen Aufgaben' : 'No open tasks'}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout rightPanel={<RightPanel />}>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl" data-testid="tasks-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center shadow-lg shadow-black/10">
              <ListChecks size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{lang === 'de' ? 'Aufgaben' : 'Tasks'}</h1>
              <p className="text-sm text-muted-foreground">{lang === 'de' ? 'Deine KI-generierten & manuellen Leadership-Aufgaben' : 'AI-generated & manual leadership tasks'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateAiTasks}
              disabled={generating}
              className="bg-[#BFFF00] hover:bg-[#d4ff4d] text-[#0A0A0A] font-black shadow-sm btn-interactive"
              data-testid="generate-ai-tasks-btn"
            >
              {generating ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Sparkles size={15} className="mr-1" />}
              {lang === 'de' ? 'KI-Aufgaben' : 'AI Tasks'}
            </Button>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-28 h-9" data-testid="task-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'de' ? 'Alle' : 'All'}</SelectItem>
                <SelectItem value="pending">{lang === 'de' ? 'Offen' : 'Open'}</SelectItem>
                <SelectItem value="completed">{lang === 'de' ? 'Erledigt' : 'Done'}</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold shadow-sm btn-interactive" data-testid="add-task-btn">
                  <Plus size={16} className="mr-1" /> {lang === 'de' ? 'Neue Aufgabe' : 'New Task'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{lang === 'de' ? 'Neue Aufgabe erstellen' : 'Create New Task'}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label>{lang === 'de' ? 'Titel' : 'Title'}</Label><Input data-testid="task-title-input" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder={lang === 'de' ? 'Aufgabe beschreiben...' : 'Describe task...'} /></div>
                  <div><Label>{lang === 'de' ? 'Beschreibung' : 'Description'}</Label><Textarea data-testid="task-desc-input" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder={lang === 'de' ? 'Details (optional)...' : 'Details...'} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{lang === 'de' ? 'Priorität' : 'Priority'}</Label>
                      <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                        <SelectTrigger data-testid="task-priority-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">{lang === 'de' ? 'Hoch' : 'High'}</SelectItem>
                          <SelectItem value="medium">{lang === 'de' ? 'Mittel' : 'Medium'}</SelectItem>
                          <SelectItem value="low">{lang === 'de' ? 'Niedrig' : 'Low'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{lang === 'de' ? 'Fällig am' : 'Due Date'}</Label>
                      <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={createTask} className="w-full bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold" data-testid="create-task-submit">{lang === 'de' ? 'Aufgabe erstellen' : 'Create Task'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Heute im Fokus — die Top 3, mit denen ein Leader operiert */}
        {filter !== 'completed' && focusTasks.length > 0 && (
          <div data-testid="focus-tasks-section">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-[#BFFF00]" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                {lang === 'de' ? 'Heute im Fokus' : "Today's Focus"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {focusTasks.map((task, i) => (
                <Card key={task.task_id} className="border-[#BFFF00]/25 bg-gradient-to-br from-[#BFFF00]/[0.05] to-transparent card-glow" data-testid={`focus-task-${i}`}>
                  <CardContent className="p-4 flex flex-col gap-2 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[18px] font-black text-[#BFFF00]/60" style={{ fontFamily: 'Outfit, sans-serif' }}>{i + 1}</span>
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 ${priorityColor(task.priority)}`}>{priorityLabel(task.priority)}</Badge>
                    </div>
                    <p className="text-[13px] font-bold leading-snug flex-1 select-text break-words">{task.title}</p>
                    {task.description && (
                      <button
                        type="button"
                        onClick={() => setExpandedTask(expandedTask === task.task_id ? null : task.task_id)}
                        aria-expanded={expandedTask === task.task_id}
                        className="text-left select-text"
                        data-testid={`focus-expand-${i}`}
                      >
                        <span className={`block text-[10.5px] text-muted-foreground ${expandedTask === task.task_id ? 'whitespace-pre-wrap break-words leading-relaxed' : 'line-clamp-2'}`}>
                          {task.description}
                        </span>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#4A6200] dark:text-[#BFFF00]">
                          {expandedTask === task.task_id
                            ? <><ChevronUp size={11} /> {lang === 'de' ? 'Weniger' : 'Less'}</>
                            : <><ChevronDown size={11} /> {lang === 'de' ? 'Mehr anzeigen' : 'Show more'}</>}
                        </span>
                      </button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => toggleTask(task)}
                      className="h-8 mt-1 bg-[#0A0A0A] hover:bg-[#1A1A2E] text-white text-[11px] font-bold w-full"
                      data-testid={`focus-done-${i}`}
                    >
                      <CheckCircle2 size={12} className="mr-1.5" /> {lang === 'de' ? 'Erledigt' : 'Done'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Task List — compact: 5 visible, rest collapsible */}
        <div className="space-y-2">
          {filtered.length > 0 && (
            <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground pt-2">
              {lang === 'de' ? 'Alle Aufgaben' : 'All Tasks'} <span className="opacity-50">({filtered.length})</span>
            </h2>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ListChecks size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">{lang === 'de' ? 'Noch keine Aufgaben. Lass WladBot welche für dich generieren!' : 'No tasks yet. Let WladBot generate some for you!'}</p>
              <Button onClick={generateAiTasks} disabled={generating} className="mt-4 bg-[#BFFF00] text-[#0A0A0A] font-black" data-testid="empty-generate-btn">
                {generating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Sparkles size={14} className="mr-1.5" />}
                {lang === 'de' ? 'KI-Aufgaben generieren' : 'Generate AI tasks'}
              </Button>
            </div>
          )}
          {(showAll ? filtered : filtered.slice(0, 5)).map((task) => (
            <Card key={task.task_id} className={`transition-all duration-200 card-glow ${task.status === 'completed' ? 'opacity-60' : ''}`} data-testid={`task-${task.task_id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <Checkbox checked={task.status === 'completed'} onCheckedChange={() => toggleTask(task)} data-testid={`task-checkbox-${task.task_id}`}
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                <div className="flex-1 min-w-0">
                  {(() => {
                    const isOpen = expandedTask === task.task_id;
                    const hasMore = Boolean(task.description) || (task.title || '').length > 70;
                    return (
                      <div
                        role={hasMore ? 'button' : undefined}
                        tabIndex={hasMore ? 0 : undefined}
                        aria-expanded={hasMore ? isOpen : undefined}
                        aria-label={hasMore ? (lang === 'de' ? `Aufgabe ${isOpen ? 'zuklappen' : 'vollständig anzeigen'}` : `${isOpen ? 'Collapse' : 'Expand'} task`) : undefined}
                        onClick={() => hasMore && setExpandedTask(isOpen ? null : task.task_id)}
                        onKeyDown={(e) => {
                          if (!hasMore) return;
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedTask(isOpen ? null : task.task_id); }
                        }}
                        className={`select-text ${hasMore ? 'cursor-pointer' : ''} rounded-lg -mx-1 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]/50`}
                        data-testid={`task-text-${task.task_id}`}
                      >
                        <div className="flex items-start gap-2">
                          <p className={`text-sm font-semibold ${isOpen ? 'whitespace-pre-wrap break-words' : ''} ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                          {task.source === 'ai_coach' && (
                            <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-[#4A6200] dark:text-[#BFFF00] bg-[#BFFF00]/10 px-1.5 py-0.5 rounded-full border border-[#BFFF00]/20 shrink-0 mt-0.5" data-testid="wladbot-task-badge">
                              <Sparkles size={8} /> von WladBot
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className={`text-[11px] text-muted-foreground mt-1 ${isOpen ? 'whitespace-pre-wrap break-words leading-relaxed' : 'truncate'}`} data-testid={`task-desc-${task.task_id}`}>
                            {task.description}
                          </p>
                        )}
                        {hasMore && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#4A6200] dark:text-[#BFFF00]" data-testid={`task-expand-${task.task_id}`}>
                            {isOpen
                              ? <><ChevronUp size={11} /> {lang === 'de' ? 'Weniger' : 'Less'}</>
                              : <><ChevronDown size={11} /> {lang === 'de' ? 'Mehr anzeigen' : 'Show more'}</>}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${priorityColor(task.priority)}`}>{priorityLabel(task.priority)}</Badge>
                    {task.category && task.category !== 'general' && <span className="text-[9px] text-muted-foreground">{task.category}</span>}
                    {task.due_date && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Clock size={9} />{new Date(task.due_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
                    )}
                    {task.created_at && <span className="text-[9px] text-muted-foreground">{lang === 'de' ? 'Erstellt' : 'Created'}: {new Date(task.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.task_id)} className="text-muted-foreground hover:text-red-400 transition-colors p-1" data-testid={`delete-task-${task.task_id}`}>
                  <Trash2 size={14} />
                </button>
              </CardContent>
            </Card>
          ))}
          {filtered.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2.5 rounded-xl border border-dashed border-black/10 dark:border-white/10 text-[11.5px] font-bold text-muted-foreground hover:text-foreground hover:border-[#BFFF00]/40 transition-colors flex items-center justify-center gap-1.5"
              data-testid="toggle-all-tasks-btn"
            >
              {showAll
                ? <><ChevronUp size={13} /> {lang === 'de' ? 'Weniger anzeigen' : 'Show less'}</>
                : <><ChevronDown size={13} /> {lang === 'de' ? `Alle ${filtered.length} anzeigen` : `Show all ${filtered.length}`}</>}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
