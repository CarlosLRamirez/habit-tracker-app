import { useState } from 'react';
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
  firstWeekdayColumn,
  monthCalendar,
  shiftMonth,
  yearMonthOf,
  type DayStatus,
  type YearMonth,
} from '../domain/calendar';
import type { Completion, Habit } from '../domain/types';

interface CalendarMonthProps {
  habit: Habit;
  completions: Completion[];
  today: string;
  /** Marca o desmarca un día pasado (FR2.3). */
  onToggleDate: (date: string) => void;
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const WEEKDAY_HEADERS = [
  { short: 'L', long: 'lunes' },
  { short: 'M', long: 'martes' },
  { short: 'X', long: 'miércoles' },
  { short: 'J', long: 'jueves' },
  { short: 'V', long: 'viernes' },
  { short: 'S', long: 'sábado' },
  { short: 'D', long: 'domingo' },
];

export const STATUS_LABELS: Record<DayStatus, string> = {
  done: 'cumplido',
  missed: 'esperado, no cumplido',
  notExpected: 'no esperado',
  outOfRange: 'fuera de rango',
};

/** Calendario mensual navegable del historial de un hábito (FR4.1). */
export function CalendarMonth({ habit, completions, today, onToggleDate }: CalendarMonthProps) {
  const [current, setCurrent] = useState<YearMonth>(() => yearMonthOf(today));
  const days = monthCalendar(habit, completions, current, today);
  const blanks = firstWeekdayColumn(current);
  const monthName = MONTHS[current.month];
  const canPrev = canGoToPreviousMonth(habit, current);
  const canNext = canGoToNextMonth(current, today);

  return (
    <section aria-labelledby={`calendar-title-${habit.id}`} data-testid="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="btn"
          aria-label="Mes anterior"
          disabled={!canPrev}
          data-testid="calendar-prev"
          onClick={() => setCurrent((c) => shiftMonth(c, -1))}
        >
          ‹
        </button>
        <h3 id={`calendar-title-${habit.id}`} className="calendar-title" aria-live="polite">
          {monthName} {current.year}
        </h3>
        <button
          type="button"
          className="btn"
          aria-label="Mes siguiente"
          disabled={!canNext}
          data-testid="calendar-next"
          onClick={() => setCurrent((c) => shiftMonth(c, 1))}
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_HEADERS.map((w) => (
          <abbr key={w.long} className="calendar-weekday" title={w.long} aria-hidden="true">
            {w.short}
          </abbr>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}
        {days.map(({ date, day, status }) => (
          <button
            key={date}
            type="button"
            className={`calendar-day calendar-day-${status}`}
            disabled={status === 'outOfRange'}
            aria-pressed={status === 'outOfRange' ? undefined : status === 'done'}
            aria-label={`${day} de ${monthName}: ${STATUS_LABELS[status]}`}
            data-testid={`day-${date}`}
            data-status={status}
            onClick={() => onToggleDate(date)}
          >
            {day}
          </button>
        ))}
      </div>

      <ul className="calendar-legend" aria-label="Leyenda">
        <li>
          <span className="legend-swatch calendar-day-done" aria-hidden="true" />
          Cumplido
        </li>
        <li>
          <span className="legend-swatch calendar-day-missed" aria-hidden="true" />
          Esperado, no cumplido
        </li>
        <li>
          <span className="legend-swatch" aria-hidden="true" />
          No esperado
        </li>
      </ul>
      <p className="muted">Pulsa un día pasado para marcarlo o desmarcarlo.</p>
    </section>
  );
}
