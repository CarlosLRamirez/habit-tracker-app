import { useId, useState, type FormEvent } from 'react';
import type { Frequency, FrequencyType, Habit, HabitInput } from '../domain/types';
import { NAME_MAX_LENGTH, validateHabitInput, type HabitInputErrors } from '../domain/validation';

interface HabitFormProps {
  /** Hábito a editar; sin él, el formulario crea uno nuevo. */
  initial?: Habit;
  /** Devuelve `true` si el hábito se guardó. */
  onSubmit: (input: HabitInput) => boolean;
  onCancel: () => void;
}

/** Días de lunes a domingo con la convención de `Date.getDay()`. */
const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: 'Todos los días' },
  { value: 'weekdays', label: 'Días concretos' },
  { value: 'timesPerWeek', label: 'N veces por semana' },
];

/** Crear y editar un hábito: nombre, frecuencia y hora de recordatorio (FR1.1–FR1.3, FR6.1). */
export function HabitForm({ initial, onSubmit, onCancel }: HabitFormProps) {
  const id = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<FrequencyType>(initial?.frequency.type ?? 'daily');
  const [days, setDays] = useState<number[]>(
    initial?.frequency.type === 'weekdays' ? initial.frequency.days : [],
  );
  const [times, setTimes] = useState<string>(
    initial?.frequency.type === 'timesPerWeek' ? String(initial.frequency.times) : '3',
  );
  const [reminderTime, setReminderTime] = useState(initial?.reminderTime ?? '');
  const [errors, setErrors] = useState<HabitInputErrors>({});

  const buildFrequency = (): Frequency => {
    switch (type) {
      case 'daily':
        return { type: 'daily' };
      case 'weekdays':
        return { type: 'weekdays', days };
      case 'timesPerWeek':
        return { type: 'timesPerWeek', times: times.trim() === '' ? Number.NaN : Number(times) };
    }
  };

  const toggleDay = (day: number) => {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateHabitInput({ name, frequency: buildFrequency(), reminderTime });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSubmit(result.value);
  };

  const nameErrorId = `${id}-name-error`;
  const frequencyErrorId = `${id}-frequency-error`;
  const timeErrorId = `${id}-time-error`;

  return (
    <section className="card" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section-title">
        {initial ? 'Editar hábito' : 'Nuevo hábito'}
      </h2>
      <form className="form" onSubmit={handleSubmit} noValidate data-testid="habit-form">
        <div className="field">
          <label htmlFor={`${id}-name`}>Nombre</label>
          <input
            id={`${id}-name`}
            className="input"
            type="text"
            value={name}
            autoComplete="off"
            placeholder="p. ej. Leer 20 minutos"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? nameErrorId : `${id}-name-hint`}
            data-testid="habit-name-input"
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name ? (
            <p id={nameErrorId} className="field-error" role="alert" data-testid="habit-name-error">
              {errors.name}
            </p>
          ) : (
            <p id={`${id}-name-hint`} className="muted no-margin">
              De 1 a {NAME_MAX_LENGTH} caracteres.
            </p>
          )}
        </div>

        <fieldset className="field" aria-describedby={errors.frequency ? frequencyErrorId : undefined}>
          <legend>Frecuencia</legend>
          <div className="choice-row">
            {FREQUENCY_OPTIONS.map((option) => (
              <label key={option.value} className="choice">
                <input
                  type="radio"
                  name={`${id}-frequency`}
                  value={option.value}
                  checked={type === option.value}
                  data-testid={`frequency-${option.value}`}
                  onChange={() => setType(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          {type === 'weekdays' && (
            <fieldset className="field">
              <legend className="visually-hidden">Días de la semana</legend>
              <div className="choice-row">
                {WEEKDAYS.map((weekday) => (
                  <label key={weekday.value} className="choice">
                    <input
                      type="checkbox"
                      checked={days.includes(weekday.value)}
                      data-testid={`weekday-${weekday.value}`}
                      onChange={() => toggleDay(weekday.value)}
                    />
                    {weekday.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {type === 'timesPerWeek' && (
            <div className="field">
              <label htmlFor={`${id}-times`}>Veces por semana (1 a 7)</label>
              <input
                id={`${id}-times`}
                className="input input-small"
                type="number"
                min={1}
                max={7}
                step={1}
                inputMode="numeric"
                value={times}
                data-testid="times-input"
                onChange={(e) => setTimes(e.target.value)}
              />
            </div>
          )}

          {errors.frequency && (
            <p id={frequencyErrorId} className="field-error" role="alert" data-testid="habit-frequency-error">
              {errors.frequency}
            </p>
          )}
        </fieldset>

        <div className="field">
          <label htmlFor={`${id}-time`}>Hora de recordatorio (opcional)</label>
          <input
            id={`${id}-time`}
            className="input input-small"
            type="time"
            value={reminderTime}
            aria-invalid={errors.reminderTime ? true : undefined}
            aria-describedby={errors.reminderTime ? timeErrorId : undefined}
            data-testid="reminder-time-input"
            onChange={(e) => setReminderTime(e.target.value)}
          />
          {errors.reminderTime && (
            <p id={timeErrorId} className="field-error" role="alert">
              {errors.reminderTime}
            </p>
          )}
        </div>

        <div className="btn-row">
          <button type="submit" className="btn btn-primary" data-testid="habit-save">
            {initial ? 'Guardar cambios' : 'Crear hábito'}
          </button>
          <button type="button" className="btn" data-testid="habit-cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
