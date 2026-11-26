import { describeFrequency } from '../domain/schedule';
import { completionRateLabel } from '../domain/stats';
import { computeStreaks, formatStreak } from '../domain/streaks';
import type { Completion, Habit } from '../domain/types';
import { CalendarMonth } from './CalendarMonth';

interface HabitDetailProps {
  habit: Habit;
  completions: Completion[];
  today: string;
  onToggleDate: (date: string) => void;
  onBack: () => void;
  onEdit: () => void;
}

/** Detalle de un hábito: rachas, estadísticas y calendario (FR3.1, FR4.1, FR5.1, FR2.3). */
export function HabitDetail({ habit, completions, today, onToggleDate, onBack, onEdit }: HabitDetailProps) {
  const streaks = computeStreaks(habit, completions, today);

  return (
    <section className="card" aria-labelledby="detail-title" data-testid="habit-detail">
      <div className="section-header">
        <button type="button" className="btn" data-testid="detail-back" onClick={onBack}>
          ← Volver
        </button>
        <button type="button" className="btn" data-testid="detail-edit" onClick={onEdit}>
          Editar
        </button>
      </div>
      <h2 id="detail-title" className="section-title habit-name">
        {habit.name}
      </h2>
      <p className="muted">
        {describeFrequency(habit)}
        {habit.reminderTime ? ` · Aviso a las ${habit.reminderTime}` : ''}
        {habit.archived ? ' · Archivado' : ''}
      </p>

      <dl className="stats">
        <div className="stat">
          <dt>Racha actual</dt>
          <dd data-testid="current-streak">{formatStreak(streaks.current, streaks.unit)}</dd>
        </div>
        <div className="stat">
          <dt>Mejor racha</dt>
          <dd data-testid="best-streak">{formatStreak(streaks.best, streaks.unit)}</dd>
        </div>
        <div className="stat">
          <dt>Esta semana</dt>
          <dd data-testid="week-rate">{completionRateLabel(habit, completions, 'week', today)}</dd>
        </div>
        <div className="stat">
          <dt>Este mes</dt>
          <dd data-testid="month-rate">{completionRateLabel(habit, completions, 'month', today)}</dd>
        </div>
      </dl>

      <CalendarMonth habit={habit} completions={completions} today={today} onToggleDate={onToggleDate} />
    </section>
  );
}
