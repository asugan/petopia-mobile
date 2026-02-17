# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Expo Router routes (e.g. `app/(tabs)/`, `app/(onboarding)/`).
- `components/`: reusable UI and feature components (e.g. `components/forms/`, `components/ui/`).
- `lib/`: shared “platform” code (local DB/repositories in `lib/db/` + `lib/repositories/`, services in `lib/services/`, schemas in `lib/schemas/`, theme in `lib/theme/`, feature hooks in `lib/hooks/`).
- `hooks/`: feature-level hooks (form logic typically lives here).
- `stores/`: client/UI state via Zustand.
- `assets/`, `locales/`: images and i18n resources.
- `android/`: native Android project (generated/managed via Expo).
- `__tests__/`: test helpers/fixtures (no runner wired by default).
- `docs/`: deployment notes and status docs.

## Build, Test, and Development Commands

- `npm start`: start the Expo dev server.
- `npm run android` / `npm run ios`: run the native app via Expo Dev Client.
- `npm run web`: run in the browser.
- `npm run lint`: run ESLint (Expo flat config).
- `npm run test`: run all Vitest unit tests.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:coverage`: run Vitest with coverage report.
- `npm run test:ui`: run Vitest UI for interactive testing.
- `npm run test:expo`: run Expo CLI tests (for component/integration tests with native modules).
- `npm run reset-project`: reset to a clean state (see `scripts/reset-project.js`).
- `npx tsc --noEmit`: typecheck (TypeScript `strict` is enabled).

## Coding Style & Naming Conventions

- Language: TypeScript + React Native (Expo). Prefer functional components and hooks.
- Naming: `PetForm.tsx`/`PetFormProps` (PascalCase), `usePetForm` (hooks), `petService` (camelCase instances).
- Imports: React → libraries → `@/` absolute imports → relative imports. Path alias: `@/*` (see `tsconfig.json`).
- State: local-first data access in `lib/hooks/` + repositories/services; UI state in Zustand stores (`stores/`).

## Testing Guidelines

### Test Strategy (2025)

The project uses a **hybrid testing approach**:

| Tool | Purpose | What to Test |
|------|---------|--------------|
| **Vitest** | Pure logic testing | Hooks, services, utils, stores, API functions |
| **Expo CLI** | Component & integration tests | UI components with native modules, Expo Router |

### Test Structure

```
__tests__/
├── unit/                 # Vitest tests (pure logic)
│   ├── hooks/            # Form hooks, custom hooks
│   ├── services/         # API service classes
│   ├── utils/            # Utility functions, helpers
│   └── stores/           # Zustand stores
└── components/           # Expo CLI tests (future - UI with native modules)
```

### Vitest Configuration

- **Config**: `vitest.config.ts`
- **Setup**: `__tests__/vitest.setup.ts` (includes React Native and Expo mocks)
- **Environment**: Node.js (no DOM needed for pure logic tests)

### Test Best Practices

1. **Separation of concerns**:
   - Pure business logic → Vitest (fast, no dependencies)
   - UI/native modules → Expo CLI (when needed)

2. **Test coverage**: Aim for 70%+ on pure logic (hooks, services, utils)

3. **Mocking**:
   - Use `vi.mock()` in `vitest.setup.ts` for React Native/Expo modules
   - Mock API calls in service tests with simple function implementations

4. **TDD**: Write tests before implementation when possible

5. **Describe tests clearly**: Use descriptive test names and organize with `describe()` blocks

### Writing Vitest Tests

**Hook Tests** (`usePetForm.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

it('should initialize with empty values', () => {
  const { result } = renderHook(() => usePetForm());
  expect(result.current.control).toBeDefined();
});
```

**Service Tests** (`eventService.test.ts`):
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

it('should create event successfully', async () => {
  const result = await eventService.createEvent(data);
  expect(result.success).toBe(true);
});
```

### Running Tests

| Command | Description |
|---------|-------------|
| `npm run test` | Run all Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode (auto-rerun on changes) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Open Vitest UI for interactive testing |
| `npm run test:expo` | Run Expo CLI tests (for component/integration tests) |

## Commit & Pull Request Guidelines

History follows a loose Conventional Commits style (e.g. `feat(finance): ...`, `fix(home): ...`, `refactor: ...`). Keep commits small and scoped.

PRs should include: a short description, linked issue/spec (if any), screenshots for UI changes, and i18n updates for user-facing strings (update `locales/` rather than hardcoding).
