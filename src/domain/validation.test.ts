import { describe, expect, it } from 'vitest';
import { validateHabitInput } from './validation';

describe('validateHabitInput (FR1.1, FR1.2, FR6.1)', () => {
  it('acepta un hábito válido y recorta el nombre', () => {
    const result = validateHabitInput({
      name: '  Leer 20 minutos  ',
      frequency: { type: 'weekdays', days: [5, 1, 1] },
      reminderTime: '21:30',
    });
    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Leer 20 minutos',
        frequency: { type: 'weekdays', days: [1, 5] },
        reminderTime: '21:30',
      },
    });
  });

  it('rechaza un nombre vacío o de solo espacios', () => {
    const result = validateHabitInput({ name: '   ', frequency: { type: 'daily' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBe('El nombre es obligatorio.');
  });

  it('acepta 60 caracteres y rechaza 61', () => {
    expect(validateHabitInput({ name: 'a'.repeat(60), frequency: { type: 'daily' } }).ok).toBe(true);
    const tooLong = validateHabitInput({ name: 'a'.repeat(61), frequency: { type: 'daily' } });
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.errors.name).toMatch(/60 caracteres/);
  });

  it('rechaza días concretos sin ningún día y N fuera de 1 a 7', () => {
    const noDays = validateHabitInput({ name: 'Correr', frequency: { type: 'weekdays', days: [] } });
    expect(noDays.ok).toBe(false);
    if (!noDays.ok) expect(noDays.errors.frequency).toMatch(/al menos un día/);

    for (const times of [0, 8, 2.5]) {
      const result = validateHabitInput({ name: 'Correr', frequency: { type: 'timesPerWeek', times } });
      expect(result.ok).toBe(false);
    }
    expect(validateHabitInput({ name: 'Correr', frequency: { type: 'timesPerWeek', times: 7 } }).ok).toBe(true);
  });

  it('rechaza una hora de recordatorio mal formada', () => {
    const result = validateHabitInput({ name: 'Agua', frequency: { type: 'daily' }, reminderTime: '25:00' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.reminderTime).toBeDefined();
  });
});
