/**
 * Modelo de datos del tracker de hábitos.
 *
 * Fechas: siempre claves locales `YYYY-MM-DD` (zona horaria del dispositivo).
 * Días de la semana: convención de `Date.getDay()` (0 = domingo, 1 = lunes … 6 = sábado).
 */

/** Frecuencia de un hábito (FR1.2). */
export type Frequency =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] }
  | { type: 'timesPerWeek'; times: number };

export type FrequencyType = Frequency['type'];

export interface Habit {
  /** Clave técnica. */
  id: string;
  /** Nombre, de 1 a 60 caracteres sin espacios en los extremos (FR1.1). */
  name: string;
  frequency: Frequency;
  /** Hora de recordatorio opcional, `HH:MM` (FR6.1). */
  reminderTime?: string;
  /** Archivado: fuera de "Hoy" y de los recordatorios, conserva el historial (FR1.5). */
  archived: boolean;
  /** Fecha local de creación, `YYYY-MM-DD` (FR2.3, FR4.1). */
  createdAt: string;
}

/** Registro de cumplimiento: como máximo uno por hábito y día (FR2.4). */
export interface Completion {
  habitId: string;
  /** Fecha local `YYYY-MM-DD`. */
  date: string;
}

/** Objeto guardado bajo la clave `habit-tracker:data` (FR7.1). */
export interface HabitData {
  habits: Habit[];
  completions: Completion[];
}

/** Datos que introduce la persona al crear o editar un hábito. */
export interface HabitInput {
  name: string;
  frequency: Frequency;
  reminderTime?: string;
}
