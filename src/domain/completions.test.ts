import { describe, expect, it } from 'vitest';
import { makeCompletion, makeHabit } from '../test/factories';
import { CompletionError, toggleCompletion } from './completions';

const TODAY = '2026-11-26';

describe('toggleCompletion (FR2.2, FR2.3, FR2.4)', () => {
  it('marca y desmarca un día con una sola acción', () => {
    const habit = makeHabit();
    const marked = toggleCompletion([], habit, TODAY, TODAY);
    expect(marked).toEqual([makeCompletion(habit.id, TODAY)]);
    expect(toggleCompletion(marked, habit, TODAY, TODAY)).toEqual([]);
  });

  it('permite marcar un día pasado desde la creación', () => {
    const habit = makeHabit();
    expect(toggleCompletion([], habit, '2026-11-02', TODAY)).toHaveLength(1);
  });

  it('rechaza un día futuro', () => {
    expect(() => toggleCompletion([], makeHabit(), '2026-11-27', TODAY)).toThrow(CompletionError);
    expect(() => toggleCompletion([], makeHabit(), '2026-11-27', TODAY)).toThrow('día futuro');
  });

  it('rechaza un día anterior a la creación del hábito', () => {
    expect(() => toggleCompletion([], makeHabit(), '2026-11-01', TODAY)).toThrow(/anterior a la creación/);
  });

  it('nunca deja más de un registro por hábito y día', () => {
    const habit = makeHabit();
    const other = makeHabit();
    const start = [makeCompletion(other.id, TODAY)];
    const once = toggleCompletion(start, habit, TODAY, TODAY);
    expect(once.filter((c) => c.habitId === habit.id && c.date === TODAY)).toHaveLength(1);
    // Volver a pulsar desmarca en vez de duplicar y no toca otros hábitos.
    expect(toggleCompletion(once, habit, TODAY, TODAY)).toEqual(start);
  });
});
