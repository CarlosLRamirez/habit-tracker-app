import { describe, expect, it, vi } from 'vitest';
import { HabitRepository, HabitValidationError, STORAGE_KEY, StorageError } from './habitRepository';

const TODAY = '2026-11-26';

function freshRepo() {
  let n = 0;
  return new HabitRepository(undefined, () => `id-${++n}`);
}

describe('HabitRepository (FR7.1, FR7.2, FR1.1–FR1.5)', () => {
  it('los datos sobreviven a una recarga (nueva instancia)', () => {
    const repo = freshRepo();
    repo.load();
    repo.createHabit({ name: 'Meditar', frequency: { type: 'daily' }, reminderTime: '07:30' }, TODAY);
    repo.toggleCompletion('id-1', TODAY, TODAY);

    const reloaded = new HabitRepository().load();
    expect(reloaded.habits).toEqual([
      { id: 'id-1', name: 'Meditar', frequency: { type: 'daily' }, reminderTime: '07:30', archived: false, createdAt: TODAY },
    ]);
    expect(reloaded.completions).toEqual([{ habitId: 'id-1', date: TODAY }]);
  });

  it('sin datos previos empieza vacío', () => {
    expect(freshRepo().load()).toEqual({ habits: [], completions: [] });
  });

  it('editar conserva los registros', () => {
    const repo = freshRepo();
    repo.createHabit({ name: 'Leer', frequency: { type: 'daily' } }, '2026-11-20');
    repo.toggleCompletion('id-1', '2026-11-21', TODAY);
    const data = repo.updateHabit('id-1', { name: 'Leer 30 min', frequency: { type: 'timesPerWeek', times: 3 } });
    expect(data.habits[0]).toMatchObject({ name: 'Leer 30 min', createdAt: '2026-11-20' });
    expect(data.habits[0].reminderTime).toBeUndefined();
    expect(data.completions).toEqual([{ habitId: 'id-1', date: '2026-11-21' }]);
  });

  it('eliminar borra el hábito y todos sus registros, y archivar los conserva', () => {
    const repo = freshRepo();
    repo.createHabit({ name: 'A', frequency: { type: 'daily' } }, TODAY);
    repo.createHabit({ name: 'B', frequency: { type: 'daily' } }, TODAY);
    repo.toggleCompletion('id-1', TODAY, TODAY);
    repo.toggleCompletion('id-2', TODAY, TODAY);

    const archived = repo.setArchived('id-2', true);
    expect(archived.habits[1].archived).toBe(true);
    expect(archived.completions).toHaveLength(2);

    const data = repo.deleteHabit('id-1');
    expect(data.habits.map((h) => h.id)).toEqual(['id-2']);
    expect(data.completions).toEqual([{ habitId: 'id-2', date: TODAY }]);
    expect(new HabitRepository().load()).toEqual(data);
  });

  it('rechaza crear un hábito con nombre vacío sin guardar nada', () => {
    const repo = freshRepo();
    expect(() => repo.createHabit({ name: '  ', frequency: { type: 'daily' } }, TODAY)).toThrow(HabitValidationError);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('lanza StorageError cuando setItem falla y no da el cambio por guardado', () => {
    const repo = freshRepo();
    repo.createHabit({ name: 'Agua', frequency: { type: 'daily' } }, TODAY);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });

    expect(() => repo.toggleCompletion('id-1', TODAY, TODAY)).toThrow(StorageError);
    vi.restoreAllMocks();
    // Ni en memoria ni en el navegador quedó el registro.
    expect(new HabitRepository().load().completions).toEqual([]);
    expect(repo.toggleCompletion('id-1', TODAY, TODAY).completions).toHaveLength(1);
  });

  it('lanza StorageError con JSON inválido o datos con forma incorrecta', () => {
    window.localStorage.setItem(STORAGE_KEY, '{no es json');
    expect(() => freshRepo().load()).toThrow(StorageError);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits: [{ id: 1 }], completions: [] }));
    expect(() => freshRepo().load()).toThrow(/dañados/);
  });

  it('lanza StorageError cuando el almacenamiento no está disponible', () => {
    const repo = new HabitRepository(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() => repo.load()).toThrow(StorageError);
  });
});
