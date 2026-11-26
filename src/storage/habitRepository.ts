import { toggleCompletion } from '../domain/completions';
import { isValidDateKey } from '../domain/dates';
import type { Completion, Habit, HabitData, HabitInput } from '../domain/types';
import { isValidFrequency, isValidTime, validateHabitInput, type HabitInputErrors } from '../domain/validation';

/** Clave de `localStorage` donde se guarda todo (FR7.1). */
export const STORAGE_KEY = 'habit-tracker:data';

/** Fallo del almacenamiento del navegador (FR7.2). Nunca se ignora en silencio. */
export class StorageError extends Error {
  readonly kind: 'unavailable' | 'corrupted' | 'writeFailed';

  constructor(kind: StorageError['kind'], message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'StorageError';
    this.kind = kind;
    if (options && 'cause' in options) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/** Datos de un hábito no válidos (FR1.1, FR1.2). */
export class HabitValidationError extends Error {
  readonly errors: HabitInputErrors;

  constructor(errors: HabitInputErrors) {
    super(Object.values(errors).filter(Boolean).join(' '));
    this.name = 'HabitValidationError';
    this.errors = errors;
  }
}

/** Hábito no encontrado. */
export class HabitNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró el hábito "${id}".`);
    this.name = 'HabitNotFoundError';
  }
}

export function emptyData(): HabitData {
  return { habits: [], completions: [] };
}

function defaultStorage(): Storage {
  return window.localStorage;
}

function defaultId(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function corrupted(detail: string): StorageError {
  return new StorageError(
    'corrupted',
    `Los datos guardados en este navegador están dañados y no se pueden leer (${detail}).`,
  );
}

function parseHabit(value: unknown, index: number): Habit {
  if (!value || typeof value !== 'object') throw corrupted(`hábito ${index}`);
  const h = value as Record<string, unknown>;
  if (typeof h.id !== 'string' || h.id === '') throw corrupted(`hábito ${index}: id`);
  if (typeof h.name !== 'string' || h.name.trim() === '') throw corrupted(`hábito ${index}: nombre`);
  if (!isValidFrequency(h.frequency)) throw corrupted(`hábito ${index}: frecuencia`);
  if (h.reminderTime !== undefined && !isValidTime(h.reminderTime)) {
    throw corrupted(`hábito ${index}: hora de recordatorio`);
  }
  if (typeof h.archived !== 'boolean') throw corrupted(`hábito ${index}: archivado`);
  if (!isValidDateKey(h.createdAt)) throw corrupted(`hábito ${index}: fecha de creación`);

  const habit: Habit = {
    id: h.id,
    name: h.name,
    frequency: h.frequency,
    archived: h.archived,
    createdAt: h.createdAt,
  };
  if (typeof h.reminderTime === 'string') habit.reminderTime = h.reminderTime;
  return habit;
}

/** Valida la forma de los datos leídos y elimina registros duplicados o huérfanos. */
export function parseHabitData(value: unknown): HabitData {
  if (!value || typeof value !== 'object') throw corrupted('formato');
  const root = value as Record<string, unknown>;
  if (!Array.isArray(root.habits) || !Array.isArray(root.completions)) throw corrupted('formato');

  const habits = root.habits.map(parseHabit);
  const ids = new Set(habits.map((h) => h.id));
  const seen = new Set<string>();
  const completions: Completion[] = [];
  root.completions.forEach((item, index) => {
    if (!item || typeof item !== 'object') throw corrupted(`registro ${index}`);
    const c = item as Record<string, unknown>;
    if (typeof c.habitId !== 'string' || !isValidDateKey(c.date)) throw corrupted(`registro ${index}`);
    const key = `${c.habitId}|${c.date}`;
    if (!ids.has(c.habitId) || seen.has(key)) return; // FR2.4: como máximo uno por día
    seen.add(key);
    completions.push({ habitId: c.habitId, date: c.date });
  });
  return { habits, completions };
}

/**
 * Acceso a los datos guardados en `localStorage` (FR7.1) y gestión de hábitos
 * (FR1.1, FR1.3, FR1.4, FR1.5). Cada operación guarda de inmediato y solo
 * devuelve los datos nuevos si el guardado funcionó; si falla, lanza
 * `StorageError` y el estado en memoria no cambia (FR7.2).
 */
export class HabitRepository {
  private data: HabitData | null = null;
  private readonly getStorage: () => Storage;
  private readonly newId: () => string;

  constructor(getStorage: () => Storage = defaultStorage, newId: () => string = defaultId) {
    this.getStorage = getStorage;
    this.newId = newId;
  }

  private storage(): Storage {
    let storage: Storage | null | undefined;
    try {
      storage = this.getStorage();
    } catch (error) {
      throw new StorageError(
        'unavailable',
        'El almacenamiento del navegador no está disponible. Revisa que no esté bloqueado o en modo privado estricto.',
        { cause: error },
      );
    }
    if (!storage) {
      throw new StorageError('unavailable', 'El almacenamiento del navegador no está disponible.');
    }
    return storage;
  }

  /** Lee los datos guardados. Sin datos previos devuelve datos vacíos. */
  load(): HabitData {
    const storage = this.storage();
    let raw: string | null;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch (error) {
      throw new StorageError('unavailable', 'No se pudieron leer los datos del navegador.', { cause: error });
    }

    if (raw === null) {
      this.data = emptyData();
      return this.data;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      const failure = corrupted('JSON no válido');
      (failure as { cause?: unknown }).cause = error;
      throw failure;
    }
    this.data = parseHabitData(parsed);
    return this.data;
  }

  /** Guarda los datos. Lanza `StorageError` si el navegador no los acepta. */
  save(data: HabitData): void {
    const storage = this.storage();
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      throw new StorageError(
        'writeFailed',
        'No se pudo guardar el cambio en el navegador (puede que no quede espacio). El cambio no se ha guardado.',
        { cause: error },
      );
    }
    this.data = data;
  }

  /**
   * Descarta unos datos dañados y empieza de cero. Solo se usa cuando la persona
   * lo pide explícitamente tras ver el error de lectura.
   */
  startFresh(): HabitData {
    const fresh = emptyData();
    this.save(fresh);
    return fresh;
  }

  private current(): HabitData {
    return this.data ?? this.load();
  }

  private commit(next: HabitData): HabitData {
    this.save(next);
    return next;
  }

  private findHabit(data: HabitData, id: string): Habit {
    const habit = data.habits.find((h) => h.id === id);
    if (!habit) throw new HabitNotFoundError(id);
    return habit;
  }

  private validated(input: HabitInput): HabitInput {
    const result = validateHabitInput(input);
    if (!result.ok) throw new HabitValidationError(result.errors);
    return result.value;
  }

  /** Crea un hábito activo con fecha de creación `today` (FR1.1). */
  createHabit(input: HabitInput, today: string): HabitData {
    if (!isValidDateKey(today)) throw new RangeError(`Fecha no válida: "${today}"`);
    const value = this.validated(input);
    const data = this.current();
    const habit: Habit = {
      id: this.newId(),
      name: value.name,
      frequency: value.frequency,
      archived: false,
      createdAt: today,
    };
    if (value.reminderTime) habit.reminderTime = value.reminderTime;
    return this.commit({ habits: [...data.habits, habit], completions: data.completions });
  }

  /** Edita nombre, frecuencia y hora de recordatorio conservando los registros (FR1.3). */
  updateHabit(id: string, input: HabitInput): HabitData {
    const value = this.validated(input);
    const data = this.current();
    const existing = this.findHabit(data, id);
    const updated: Habit = {
      id: existing.id,
      name: value.name,
      frequency: value.frequency,
      archived: existing.archived,
      createdAt: existing.createdAt,
    };
    if (value.reminderTime) updated.reminderTime = value.reminderTime;
    return this.commit({
      habits: data.habits.map((h) => (h.id === id ? updated : h)),
      completions: data.completions,
    });
  }

  /** Elimina el hábito y todos sus registros (FR1.4). */
  deleteHabit(id: string): HabitData {
    const data = this.current();
    this.findHabit(data, id);
    return this.commit({
      habits: data.habits.filter((h) => h.id !== id),
      completions: data.completions.filter((c) => c.habitId !== id),
    });
  }

  /** Archiva o reactiva un hábito sin tocar su historial (FR1.5). */
  setArchived(id: string, archived: boolean): HabitData {
    const data = this.current();
    this.findHabit(data, id);
    return this.commit({
      habits: data.habits.map((h) => (h.id === id ? { ...h, archived } : h)),
      completions: data.completions,
    });
  }

  /** Marca o desmarca un día (FR2.2, FR2.3, FR2.4). */
  toggleCompletion(habitId: string, date: string, today: string): HabitData {
    const data = this.current();
    const habit = this.findHabit(data, habitId);
    return this.commit({
      habits: data.habits,
      completions: toggleCompletion(data.completions, habit, date, today),
    });
  }
}
