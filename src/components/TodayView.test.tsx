import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { HabitRepository, STORAGE_KEY } from '../storage/habitRepository';
import { makeHabit } from '../test/factories';

// Jueves 2026-11-26 a las 10:00 (hora local).
const NOW = new Date(2026, 10, 26, 10, 0);

function seed(data: object) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

describe('Vista Hoy (FR2.1, FR2.2, FR6.4, FR7.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  it('muestra solo los hábitos que tocan hoy y el toggle persiste', async () => {
    const daily = makeHabit({ name: 'Beber agua' });
    const monday = makeHabit({ name: 'Gimnasio', frequency: { type: 'weekdays', days: [1] } });
    const archived = makeHabit({ name: 'Antiguo', archived: true });
    seed({ habits: [daily, monday, archived], completions: [] });

    const user = userEvent.setup();
    render(<App repository={new HabitRepository()} />);

    expect(screen.getByText('Beber agua')).toBeInTheDocument();
    expect(screen.queryByText('Gimnasio')).not.toBeInTheDocument();
    expect(screen.queryByText('Antiguo')).not.toBeInTheDocument();

    const toggle = screen.getByTestId(`toggle-${daily.id}`);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.completions).toEqual([{ habitId: daily.id, date: '2026-11-26' }]);
  });

  it('resalta como pendientes los hábitos cuya hora ya pasó', () => {
    const late = makeHabit({ name: 'Vitaminas', reminderTime: '08:00' });
    const later = makeHabit({ name: 'Leer', reminderTime: '22:00' });
    seed({ habits: [late, later], completions: [] });

    render(<App repository={new HabitRepository()} />);

    const lateItem = screen.getByTestId(`today-item-${late.id}`);
    expect(lateItem).toHaveAttribute('data-pending', 'true');
    expect(within(lateItem).getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByTestId(`today-item-${later.id}`)).toHaveAttribute('data-pending', 'false');
  });

  it('si el guardado falla muestra un error y no da el cambio por hecho', async () => {
    const daily = makeHabit({ name: 'Estirar' });
    seed({ habits: [daily], completions: [] });
    const user = userEvent.setup();
    render(<App repository={new HabitRepository()} />);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    await user.click(screen.getByTestId(`toggle-${daily.id}`));

    expect(screen.getByTestId('error-banner')).toHaveTextContent('No se pudo guardar');
    expect(screen.getByTestId(`toggle-${daily.id}`)).toHaveAttribute('aria-pressed', 'false');
  });
});
