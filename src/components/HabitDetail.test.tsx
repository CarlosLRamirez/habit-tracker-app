import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeCompletions, makeHabit } from '../test/factories';
import { HabitDetail } from './HabitDetail';

const TODAY = '2026-11-26';

describe('HabitDetail (FR3.1, FR4.1, FR5.1, FR2.3)', () => {
  it('muestra la racha, las estadísticas y el calendario del mes', () => {
    const habit = makeHabit({ name: 'Leer' }); // creado el 2026-11-02
    const completions = makeCompletions(habit.id, ['2026-11-23', '2026-11-24', '2026-11-25']);
    render(
      <HabitDetail habit={habit} completions={completions} today={TODAY} onToggleDate={() => {}} onBack={() => {}} onEdit={() => {}} />,
    );

    expect(screen.getByTestId('current-streak')).toHaveTextContent('3 días');
    expect(screen.getByTestId('best-streak')).toHaveTextContent('3 días');
    expect(screen.getByTestId('week-rate')).toHaveTextContent('75 %');
    expect(screen.getByRole('heading', { name: 'noviembre 2026' })).toBeInTheDocument();
    expect(screen.getByTestId('day-2026-11-23')).toHaveAttribute('data-status', 'done');
    expect(screen.getByTestId('day-2026-11-20')).toHaveAttribute('data-status', 'missed');
  });

  it('permite marcar un día pasado pero no uno futuro ni anterior a la creación', async () => {
    const habit = makeHabit();
    const onToggleDate = vi.fn();
    const user = userEvent.setup();
    render(<HabitDetail habit={habit} completions={[]} today={TODAY} onToggleDate={onToggleDate} onBack={() => {}} onEdit={() => {}} />);

    await user.click(screen.getByTestId('day-2026-11-10'));
    expect(onToggleDate).toHaveBeenCalledWith('2026-11-10');

    expect(screen.getByTestId('day-2026-11-27')).toBeDisabled();
    expect(screen.getByTestId('day-2026-11-01')).toBeDisabled();
    // Creado en noviembre: no se puede ir a meses anteriores ni posteriores.
    expect(screen.getByTestId('calendar-prev')).toBeDisabled();
    expect(screen.getByTestId('calendar-next')).toBeDisabled();
  });
});
