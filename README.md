# Mis hábitos: tracker de hábitos personal (MVP)

App web de un solo usuario para registrar hábitos, marcarlos como hechos y ver el progreso
(rachas, calendario mensual y porcentajes de la semana y del mes), con recordatorios mientras
la app está abierta. No hay servidor ni cuentas: todos los datos se guardan en el navegador.

Tecnología: React + TypeScript + Vite, pruebas con Vitest + Testing Library, datos en
`localStorage` y un service worker escrito a mano para el uso sin conexión.

App publicada: https://carloslramirez.com/habit-tracker-app/

## Cómo se construyó: AI-DLC

Esta app se construyó con la metodología y el workflow de **AI-DLC (AI-Driven Development Life
Cycle)**, versión **2.11.5**, usando Claude Code como asistente. AI-DLC organiza el desarrollo
asistido por IA en etapas ordenadas: en cada una el asistente hace preguntas, genera el documento
o el código y se detiene para que la persona lo apruebe antes de seguir. Así queda un registro
escrito de lo decidido y por qué.

Se usó el plan **express** (6 etapas, el más ligero):

1. **Análisis de requisitos**: preguntas sobre frecuencias, funciones, plataforma, almacenamiento
   y recordatorios; de ahí salieron los requisitos funcionales y no funcionales con su
   trazabilidad.
2. **Generación de código**: un plan de 11 pasos y la app con sus 59 pruebas, generados por un
   agente desarrollador.
3. **Build and Test**: build de producción, ejecución de las pruebas y verificación de cada
   requisito frente al código.
4. **Deployment Pipeline**: diseño del despliegue a GitHub Pages con GitHub Actions, estrategia y
   runbook de rollback.
5. **Deployment Execution**: creación del repositorio, primer despliegue y prueba de humo.
6. **Observability Setup**: SLO, alarmas y cómo vigilar la app.

Si quieres experimentar con AI-DLC:

- Repositorio: https://github.com/awslabs/aidlc-workflows
- Documentación: https://awslabs.github.io/aidlc-workflows/ (empieza por la
  [guía de usuario](https://awslabs.github.io/aidlc-workflows/guide/00-introduction/))

Los documentos de trabajo de AI-DLC (requisitos, planes, decisiones) se quedaron fuera de este
repositorio público.

## Requisitos previos

- Node.js 20 o superior y npm.

## Instalar

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`). En desarrollo el service
worker no se registra, para que la caché no oculte los cambios.

## Probar

```bash
npx vitest run src                               # todas las pruebas
npx vitest run src/domain                        # lógica de dominio
npx vitest run src/storage                       # almacenamiento
npx vitest run src/components src/notifications  # interfaz y avisos
```

`npm test` equivale a `npx vitest run src`.

## Construir y previsualizar

```bash
npm run build     # comprueba los tipos (tsc) y genera dist/
npm run preview   # sirve dist/ en local para probar la versión final
```

`dist/` es una app estática: se puede publicar en cualquier alojamiento de archivos estáticos,
también en una subcarpeta (las rutas son relativas). Para que el uso sin conexión y las
notificaciones funcionen, debe servirse por HTTPS (o desde `localhost`).

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/domain/` | Modelo de datos y reglas: validación, qué hábitos tocan, marcar días, rachas, estadísticas, calendario y pendientes |
| `src/storage/` | `HabitRepository`: lectura y guardado en `localStorage` (clave `habit-tracker:data`) y gestión de hábitos |
| `src/state/` | Hooks de React (`useHabits`, `useNow`) |
| `src/components/` | Vistas: Hoy, lista de hábitos, formulario, detalle con calendario y estado de los avisos |
| `src/notifications/` | Permiso de notificaciones y revisión de recordatorios cada 30 s |
| `public/` | `sw.js` (uso sin conexión), `manifest.webmanifest` e icono |

## Reglas que conviene conocer

- La semana empieza el lunes y los días se calculan con la zona horaria del dispositivo.
- Rachas: los hábitos diarios y de días concretos cuentan días esperados seguidos cumplidos;
  los de N veces por semana cuentan semanas seguidas con la meta cumplida. Hoy (o la semana en
  curso) sin completar no rompe la racha.
- Porcentajes: cumplimientos entre ocurrencias esperadas hasta hoy. En los hábitos de N veces
  por semana, cada semana aporta como máximo N ocurrencias esperadas, limitadas a los días ya
  transcurridos de esa semana dentro del periodo. Sin ocurrencias esperadas se muestra "—".
- Un hábito de N veces por semana deja de aparecer en "Hoy" cuando la meta semanal ya se cumplió
  en días anteriores; si se cumple hoy, sigue visible para poder desmarcarlo.

## Limitaciones

- **Avisos solo con la app abierta**: los recordatorios se muestran mientras la app está abierta
  en una pestaña o instalada como app. Con el navegador cerrado no hay avisos (no hay servidor
  para notificaciones push). Al abrir la app, los hábitos cuya hora ya pasó aparecen resaltados
  como pendientes en "Hoy".
- **Borrar los datos del navegador borra los hábitos**: los datos solo existen en este navegador
  y este dispositivo. No hay sincronización, copia de seguridad ni exportación.
- Si el navegador bloquea el almacenamiento o se queda sin espacio, la app muestra un error y el
  cambio no se guarda. Si los datos guardados están dañados, la app lo indica y ofrece empezar
  de cero; no los sobrescribe sin que lo pidas.
- Si el permiso de notificaciones está denegado o el navegador no las admite, la app lo indica y
  sigue funcionando.
