import { useCallback, useState } from 'react';
import type { HabitData, HabitInput } from '../domain/types';
import { CompletionError } from '../domain/completions';
import { emptyData, HabitRepository, HabitValidationError, StorageError } from '../storage/habitRepository';

export interface HabitsController {
  data: HabitData;
  /** Mensaje de error visible (FR7.2); `null` si no hay. */
  error: string | null;
  /** `true` si los datos guardados están dañados y no se pudieron leer. */
  dataCorrupted: boolean;
  dismissError: () => void;
  createHabit: (input: HabitInput, today: string) => boolean;
  updateHabit: (id: string, input: HabitInput) => boolean;
  deleteHabit: (id: string) => boolean;
  setArchived: (id: string, archived: boolean) => boolean;
  toggleCompletion: (habitId: string, date: string, today: string) => boolean;
  startFresh: () => boolean;
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Ha ocurrido un error inesperado.';
}

function reportError(error: unknown): void {
  // Los errores de datos introducidos ya se muestran en pantalla; los fallos de
  // almacenamiento y los inesperados también quedan en la consola.
  if (error instanceof HabitValidationError || error instanceof CompletionError) return;
  console.error(error);
}

interface InitialState {
  data: HabitData;
  error: string | null;
  dataCorrupted: boolean;
}

function loadInitial(repository: HabitRepository): InitialState {
  try {
    return { data: repository.load(), error: null, dataCorrupted: false };
  } catch (error) {
    reportError(error);
    return {
      data: emptyData(),
      error: messageOf(error),
      dataCorrupted: error instanceof StorageError && error.kind === 'corrupted',
    };
  }
}

/**
 * Carga los datos al montar y expone las acciones. Cada acción guarda de inmediato;
 * si el guardado falla, el estado en pantalla no cambia y se muestra el error (FR7.2).
 * Devuelve `true` solo si el cambio quedó guardado.
 */
export function useHabits(repository: HabitRepository): HabitsController {
  const [initial] = useState(() => loadInitial(repository));
  const [data, setData] = useState<HabitData>(initial.data);
  const [error, setError] = useState<string | null>(initial.error);
  const [dataCorrupted, setDataCorrupted] = useState(initial.dataCorrupted);

  const run = useCallback((action: () => HabitData): boolean => {
    try {
      const next = action();
      setData(next);
      setError(null);
      return true;
    } catch (failure) {
      reportError(failure);
      setError(messageOf(failure));
      return false;
    }
  }, []);

  return {
    data,
    error,
    dataCorrupted,
    dismissError: () => setError(null),
    createHabit: (input, today) => run(() => repository.createHabit(input, today)),
    updateHabit: (id, input) => run(() => repository.updateHabit(id, input)),
    deleteHabit: (id) => run(() => repository.deleteHabit(id)),
    setArchived: (id, archived) => run(() => repository.setArchived(id, archived)),
    toggleCompletion: (habitId, date, today) => run(() => repository.toggleCompletion(habitId, date, today)),
    startFresh: () => {
      const ok = run(() => repository.startFresh());
      if (ok) setDataCorrupted(false);
      return ok;
    },
  };
}
