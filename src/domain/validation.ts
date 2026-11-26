import type { Frequency, HabitInput } from './types';

export const NAME_MAX_LENGTH = 60;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface HabitInputErrors {
  name?: string;
  frequency?: string;
  reminderTime?: string;
}

export type ValidationResult =
  | { ok: true; value: HabitInput }
  | { ok: false; errors: HabitInputErrors };

/** Valida y normaliza una frecuencia; devuelve el mensaje de error o la frecuencia limpia. */
function validateFrequency(frequency: unknown): { value?: Frequency; error?: string } {
  if (!frequency || typeof frequency !== 'object') {
    return { error: 'Elige un tipo de frecuencia.' };
  }
  const candidate = frequency as { type?: unknown; days?: unknown; times?: unknown };
  switch (candidate.type) {
    case 'daily':
      return { value: { type: 'daily' } };
    case 'weekdays': {
      const days = Array.isArray(candidate.days) ? candidate.days : [];
      const valid = days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
      const unique = Array.from(new Set(days as number[])).sort((a, b) => a - b);
      if (!valid || unique.length === 0) {
        return { error: 'Elige al menos un día de la semana.' };
      }
      return { value: { type: 'weekdays', days: unique } };
    }
    case 'timesPerWeek': {
      const times = candidate.times;
      if (typeof times !== 'number' || !Number.isInteger(times) || times < 1 || times > 7) {
        return { error: 'El número de veces por semana debe estar entre 1 y 7.' };
      }
      return { value: { type: 'timesPerWeek', times } };
    }
    default:
      return { error: 'Elige un tipo de frecuencia.' };
  }
}

/**
 * Valida los datos de un hábito (FR1.1, FR1.2, FR6.1).
 * El nombre se recorta y debe tener de 1 a 60 caracteres.
 */
export function validateHabitInput(input: {
  name: unknown;
  frequency: unknown;
  reminderTime?: unknown;
}): ValidationResult {
  const errors: HabitInputErrors = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length === 0) {
    errors.name = 'El nombre es obligatorio.';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `El nombre no puede tener más de ${NAME_MAX_LENGTH} caracteres.`;
  }

  const frequency = validateFrequency(input.frequency);
  if (frequency.error) {
    errors.frequency = frequency.error;
  }

  let reminderTime: string | undefined;
  if (input.reminderTime !== undefined && input.reminderTime !== null && input.reminderTime !== '') {
    if (typeof input.reminderTime === 'string' && TIME_PATTERN.test(input.reminderTime)) {
      reminderTime = input.reminderTime;
    } else {
      errors.reminderTime = 'La hora debe tener el formato HH:MM.';
    }
  }

  if (errors.name || errors.frequency || errors.reminderTime || !frequency.value) {
    return { ok: false, errors };
  }

  const value: HabitInput = { name, frequency: frequency.value };
  if (reminderTime) value.reminderTime = reminderTime;
  return { ok: true, value };
}

/** `true` si la frecuencia es válida (usado al leer datos guardados). */
export function isValidFrequency(frequency: unknown): frequency is Frequency {
  return validateFrequency(frequency).value !== undefined;
}

/** `true` si el texto es una hora `HH:MM` válida. */
export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}
