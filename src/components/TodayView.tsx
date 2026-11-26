import { completedDates, isCompleted } from '../domain/completions';
import { toDateKey, weekStart } from '../domain/dates';
import { isPending } from '../domain/reminders';
import { describeFrequency, isDueToday, weekCompletions } from '../domain/schedule';
import { computeStreaks, formatStreak } from '../domain/streaks';
import type { Completion, Habit } from '../domain/types';

interface TodayViewProps {
  habits: Habit[];
  completions: Completion[];
  now: Date;
  onToggle: (habitId: string) => void;
  onOpen: (habitId: string) => void;
  onCreate: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

/** Vista "Hoy": hábitos que tocan hoy, toggle de un clic y pendientes resaltados (FR2.1, FR2.2, FR6.4). */
export function TodayView({ habits, completions, now, onToggle, onOpen, onCreate }: TodayViewProps) {
  const today = toDateKey(now);
  const active = habits.filter((h) => !h.archived);
  const due = active.filter((h) => isDueToday(h, completions, today));
  const pendingCount = due.filter((h) => isPending(h, completions, now)).length;

  return (
    <section className="card" aria-labelledby="today-title" data-testid="today-view">
      <h2 id="today-title" className="section-title">
        Hoy, {dateFormatter.format(now)}
      </h2>

      {active.length === 0 ? (
        <div className="btn-row btn-row-center">
          <p className="muted no-margin">Aún no tienes hábitos.</p>
          <button type="button" className="btn btn-primary" data-testid="today-create" onClick={onCreate}>
            Crear mi primer hábito
          </button>
        </div>
      ) : due.length === 0 ? (
        <p className="muted" data-testid="today-empty">
          Hoy no te toca ningún hábito.
        </p>
      ) : (
        <>
          {pendingCount > 0 && (
            <p data-testid="pending-summary">
              {pendingCount === 1
                ? 'Tienes 1 hábito pendiente cuya hora de recordatorio ya pasó.'
                : `Tienes ${pendingCount} hábitos pendientes cuya hora de recordatorio ya pasó.`}
            </p>
          )}
          <ul className="habit-list">
            {due.map((habit) => {
              const done = isCompleted(completions, habit.id, today);
              const pending = isPending(habit, completions, now);
              const streaks = computeStreaks(habit, completions, today);
              const weekly =
                habit.frequency.type === 'timesPerWeek'
                  ? ` · ${weekCompletions(completedDates(completions, habit.id), weekStart(today))} de ${habit.frequency.times} esta semana`
                  : '';
              return (
                <li
                  key={habit.id}
                  className={pending ? 'habit-item habit-item-pending' : 'habit-item'}
                  data-testid={`today-item-${habit.id}`}
                  data-pending={pending ? 'true' : 'false'}
                >
                  <span className="habit-name">
                    <button
                      type="button"
                      className="link-button"
                      data-testid={`today-open-${habit.id}`}
                      onClick={() => onOpen(habit.id)}
                      aria-label={`Ver detalle de «${habit.name}»`}
                    >
                      {habit.name}
                    </button>
                    {pending && <span className="badge">Pendiente</span>}
                    <span className="habit-meta">
                      {describeFrequency(habit)}
                      {habit.reminderTime ? ` · Aviso ${habit.reminderTime}` : ''}
                      {weekly} · Racha: {formatStreak(streaks.current, streaks.unit)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn toggle"
                    aria-pressed={done}
                    aria-label={done ? `Desmarcar «${habit.name}» como hecho hoy` : `Marcar «${habit.name}» como hecho hoy`}
                    data-testid={`toggle-${habit.id}`}
                    onClick={() => onToggle(habit.id)}
                  >
                    {done ? '✓ Hecho' : 'Marcar hecho'}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
