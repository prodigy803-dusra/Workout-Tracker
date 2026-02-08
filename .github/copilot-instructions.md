## Quick context
- This is an Expo + React Native TypeScript app (see `package.json`).
- Core areas: app entry (`App.tsx`), navigation (`src/navigation/index.tsx`),
  SQLite DB layer (`src/db/*`), screens (`src/screens/*`) and UI components (`src/components/*`).

## Architecture highlights
- Single-process mobile app using Expo runtime. Navigation uses React Navigation
  with a bottom tab navigator and nested native-stack flows (`src/navigation/index.tsx`).
- Local persistence: `expo-sqlite` via a small DB abstraction in `src/db/db.ts`.
  - Use `executeSqlAsync(sql, params)` for queries; it returns `{ rows }` wrapper.
  - Migrations are defined in `src/db/migrations.ts` and applied by `initDb()`.
  - Seeding lives in `src/db/seed.ts` and is run if needed after migrations.
- Data-access is organized into repository modules under `src/db/repositories/` (e.g. `exercisesRepo.ts`).

## Developer workflows (commands)
- Install: `npm install` (see `README.md`).
- Run dev server / emulator: `npm run start` (or `npm run android` / `npm run ios`).
- This project uses Expo CLI; use the Expo Dev Tools to open emulators or scan QR codes.

## Project-specific conventions
- TypeScript-first: prefer typed exports for repositories and DB helpers.
- DB changes: add SQL statements to the end of the migrations array in
  `src/db/migrations.ts`. Migrations are applied in order; incrementing version happens automatically.
- Seeding: place idempotent seed logic in `src/db/seed.ts` and call via `seedIfNeeded()`.
- UI screens: each screen component lives in `src/screens/*`. Navigation names are defined in `src/navigation/index.tsx`.
- Components: small, focused presentational components in `src/components/` (follow existing `SetRow.tsx` and `OptionChips.tsx`).

## Integration & external deps to be aware of
- Expo modules: `expo-file-system`, `expo-sharing`, `expo-sqlite` (DB), `expo-status-bar`.
- Navigation: `@react-navigation/*` (tab + native stack). Keep screen names stable to avoid breaking deep links.
- Large lists use `@shopify/flash-list` — prefer it for performance when rendering session or exercise lists.

## Patterns and examples
- DB read example:

  ```ts
  const res = await executeSqlAsync('SELECT * FROM exercises WHERE id = ?;', [id]);
  const item = res.rows.length ? res.rows.item(0) : null;
  ```

- Add migration example: append SQL string to `migrations` array and incrementally test via app restart.

## Where to change behavior safely
- UI/UX: update `src/screens/*` and `src/components/*`.
- Business logic / data: update repository modules in `src/db/repositories/*`.
- Schema changes: `src/db/migrations.ts` and optional seed updates in `src/db/seed.ts`.

## What NOT to change casually
- Do not rename navigation route keys in `src/navigation/index.tsx` without updating callers.
- Avoid direct SQL modifications outside migrations; always put persistent schema changes into migrations.

If anything above is unclear or you want more examples (e.g. creating a repository or adding a migration), tell me which area to expand.
