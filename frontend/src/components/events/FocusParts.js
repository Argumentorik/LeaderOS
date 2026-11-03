import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';

const DAYS = [
  { id: 'monday', de: 'Montag', en: 'Monday', short: { de: 'Mo', en: 'Mon' } },
  { id: 'tuesday', de: 'Dienstag', en: 'Tuesday', short: { de: 'Di', en: 'Tue' } },
  { id: 'wednesday', de: 'Mittwoch', en: 'Wednesday', short: { de: 'Mi', en: 'Wed' } },
  { id: 'thursday', de: 'Donnerstag', en: 'Thursday', short: { de: 'Do', en: 'Thu' } },
  { id: 'friday', de: 'Freitag', en: 'Friday', short: { de: 'Fr', en: 'Fri' } },
];

const SESSION_TYPES = [
  { id: 'deep_work', label: { de: 'Deep Work', en: 'Deep Work' }, color: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 dark:bg-sky-50 dark:bg-sky-500/100/10 dark:text-sky-400' },
  { id: 'review', label: { de: 'Review & Reflexion', en: 'Review & Reflection' }, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  { id: 'planning', label: { de: 'Planung', en: 'Planning' }, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
];

const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
];

export { DAYS, SESSION_TYPES, TIME_OPTIONS };

export const WeekGrid = ({ slots, onRemove, de }) => (
  <div className="grid grid-cols-5 gap-2">
    {DAYS.map(day => {
      const daySlots = slots.filter(s => s.day === day.id);
      const hasSlot = daySlots.length > 0;
      return (
        <div key={day.id} className="text-center">
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${hasSlot ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50'}`}>
            {de ? day.short.de : day.short.en}
          </div>
          <div className={`rounded-xl p-2 min-h-[80px] transition-all ${
            hasSlot
              ? 'bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/15'
              : 'bg-gray-50 dark:bg-muted/20 border border-dashed border-gray-200 dark:border-white/[0.06]'
          }`}>
            {daySlots.map(slot => {
              const typeInfo = SESSION_TYPES.find(t => t.id === slot.session_type);
              return (
                <div key={slot.slot_id} className="relative group mb-1">
                  <div className="text-[10px] font-bold">{slot.start_time}</div>
                  <div className="text-[9px] text-muted-foreground">{slot.end_time}</div>
                  {typeInfo && (
                    <Badge className={`${typeInfo.color} text-[7px] font-bold border-0 mt-1 px-1.5 py-0`}>
                      {typeInfo.label[de ? 'de' : 'en']}
                    </Badge>
                  )}
                  <button
                    onClick={() => onRemove(slot.slot_id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`remove-slot-${slot.slot_id}`}
                  >
                    <Trash2 size={8} />
                  </button>
                </div>
              );
            })}
            {!hasSlot && <div className="text-[10px] text-muted-foreground/30 pt-4">·</div>}
          </div>
        </div>
      );
    })}
  </div>
);

export const AddSlotForm = ({ newSlot, setNewSlot, onAdd, onCancel, de }) => (
  <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted/20 border border-gray-200 dark:border-white/[0.06] space-y-3 animate-fade-in" data-testid="add-slot-form">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">{de ? 'Tag' : 'Day'}</label>
        <select value={newSlot.day} onChange={e => setNewSlot(prev => ({ ...prev, day: e.target.value }))}
          className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-card px-2 text-sm" data-testid="slot-day-select">
          {DAYS.map(d => <option key={d.id} value={d.id}>{de ? d.de : d.en}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">{de ? 'Von' : 'From'}</label>
        <select value={newSlot.start_time} onChange={e => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
          className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-card px-2 text-sm" data-testid="slot-start-select">
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">{de ? 'Bis' : 'To'}</label>
        <select value={newSlot.end_time} onChange={e => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
          className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-card px-2 text-sm" data-testid="slot-end-select">
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">{de ? 'Typ' : 'Type'}</label>
        <select value={newSlot.session_type} onChange={e => setNewSlot(prev => ({ ...prev, session_type: e.target.value }))}
          className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-card px-2 text-sm" data-testid="slot-type-select">
          {SESSION_TYPES.map(st => <option key={st.id} value={st.id}>{de ? st.label.de : st.label.en}</option>)}
        </select>
      </div>
    </div>
    <div className="flex gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={onCancel} className="text-xs font-semibold">
        {de ? 'Abbrechen' : 'Cancel'}
      </Button>
      <Button size="sm" onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold" data-testid="confirm-add-slot">
        <Plus size={12} className="mr-1" /> {de ? 'Hinzufügen' : 'Add Slot'}
      </Button>
    </div>
  </div>
);
