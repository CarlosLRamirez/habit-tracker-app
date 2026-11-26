import { useEffect, useRef, useState } from 'react';
import { HabitDetail } from './components/HabitDetail';
import { HabitForm } from './components/HabitForm';
import { HabitList } from './components/HabitList';
import { NotificationStatus } from './components/NotificationStatus';
import { TodayView } from './components/TodayView';
import { toDateKey } from './domain/dates';
import type { HabitData, HabitInput } from './domain/types';
import {
  createNotifier,
  getNotificationSupport,
  requestNotificationPermission,
  type NotificationSupport,
} from './notifications/notifier';
import { useHabits } from './state/useHabits';
import { useNow } from './state/useNow';
import { HabitRepository } from './storage/habitRepository';

type View =
  | { name: 'today' }
  | { name: 'habits' }
  | { name: 'new' }
  | { name: 'edit'; id: string }
  | { name: 'detail'; id: string };

interface AppProps {
  /** Permite inyectar el repositorio (pruebas). Por defecto usa `localStorage`. */
  repository?: HabitRepository;
}

export default function App({ repository }: AppProps) {
  const [repo] = useState(() => repository ?? new HabitRepository());
  const habits = useHabits(repo);
  const now = useNow();
  const today = toDateKey(now);
  const [view, setView] = useState<View>({ name: 'today' });
  const [notificationSupport, setNotificationSupport] = useState<NotificationSupport>(getNotificationSupport);

  // Recordatorios mientras la app está abierta (FR6.2).
  const dataRef = useRef<HabitData>(habits.data);
  const permissionRef = useRef(notificationSupport);
  useEffect(() => {
    dataRef.current = habits.data;
    permissionRef.current = notificationSupport;
  });
  useEffect(() => {
    const notifier = createNotifier({
      getData: () => dataRef.current,
      getPermission: () => permissionRef.current,
    });
    notifier.start();
    return () => notifier.stop();
  }, []);

  const requestPermission = () => {
    requestNotificationPermission()
      .then(setNotificationSupport)
      .catch((error: unknown) => console.error(error));
  };

  const { data } = habits;
  const findHabit = (id: string) => data.habits.find((h) => h.id === id);

  const submitNew = (input: HabitInput) => {
    const ok = habits.createHabit(input, today);
    if (ok) setView({ name: 'habits' });
    return ok;
  };

  const submitEdit = (id: string) => (input: HabitInput) => {
    const ok = habits.updateHabit(id, input);
    if (ok) setView({ name: 'detail', id });
    return ok;
  };

  const renderView = () => {
    switch (view.name) {
      case 'today':
        return (
          <TodayView
            habits={data.habits}
            completions={data.completions}
            now={now}
            onToggle={(id) => habits.toggleCompletion(id, today, today)}
            onOpen={(id) => setView({ name: 'detail', id })}
            onCreate={() => setView({ name: 'new' })}
          />
        );
      case 'habits':
        return (
          <HabitList
            habits={data.habits}
            onCreate={() => setView({ name: 'new' })}
            onOpen={(id) => setView({ name: 'detail', id })}
            onEdit={(id) => setView({ name: 'edit', id })}
            onSetArchived={(id, archived) => habits.setArchived(id, archived)}
            onDelete={(id) => habits.deleteHabit(id)}
          />
        );
      case 'new':
        return <HabitForm onSubmit={submitNew} onCancel={() => setView({ name: 'habits' })} />;
      case 'edit': {
        const habit = findHabit(view.id);
        if (!habit) return <p className="muted">Este hábito ya no existe.</p>;
        return (
          <HabitForm
            key={habit.id}
            initial={habit}
            onSubmit={submitEdit(habit.id)}
            onCancel={() => setView({ name: 'detail', id: habit.id })}
          />
        );
      }
      case 'detail': {
        const habit = findHabit(view.id);
        if (!habit) return <p className="muted">Este hábito ya no existe.</p>;
        return (
          <HabitDetail
            key={habit.id}
            habit={habit}
            completions={data.completions}
            today={today}
            onToggleDate={(date) => habits.toggleCompletion(habit.id, date, today)}
            onBack={() => setView({ name: 'habits' })}
            onEdit={() => setView({ name: 'edit', id: habit.id })}
          />
        );
      }
    }
  };

  const section = view.name === 'today' ? 'today' : 'habits';

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Mis hábitos</h1>
        <nav className="tabs" aria-label="Secciones">
          <button
            type="button"
            className="tab"
            aria-current={section === 'today' ? 'page' : undefined}
            data-testid="nav-today"
            onClick={() => setView({ name: 'today' })}
          >
            Hoy
          </button>
          <button
            type="button"
            className="tab"
            aria-current={section === 'habits' ? 'page' : undefined}
            data-testid="nav-habits"
            onClick={() => setView({ name: 'habits' })}
          >
            Hábitos
          </button>
        </nav>
      </header>

      <main className="app-main">
        {habits.error && (
          <div className="banner banner-error" role="alert" data-testid="error-banner">
            <span>{habits.error}</span>
            <span className="btn-row">
              {habits.dataCorrupted && (
                <button type="button" className="btn" data-testid="start-fresh" onClick={() => habits.startFresh()}>
                  Empezar de cero (borra los datos dañados)
                </button>
              )}
              <button type="button" className="btn" data-testid="dismiss-error" onClick={habits.dismissError}>
                Cerrar
              </button>
            </span>
          </div>
        )}

        <NotificationStatus support={notificationSupport} onRequestPermission={requestPermission} />

        {renderView()}
      </main>

      <footer className="muted app-footer">
        Tus datos se guardan solo en este navegador. Si borras los datos del navegador, se borran tus hábitos.
      </footer>
    </div>
  );
}
