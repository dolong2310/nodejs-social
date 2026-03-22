# Coding Conventions

**Analysis Date:** 2026-03-21

## Naming Patterns

**Files:**
- Use `kebab-case` + suffix by layer: `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.validation.ts`, `*.route.ts` (examples: `src/controllers/auth.controller.ts`, `src/services/auth.service.ts`, `src/repositories/user.repository.ts`, `src/validations/users.validation.ts`, `src/routes/auth.route.ts`).
- Use grouped DTO files by direction: `*.request.dto.ts`, `*.response.dto.ts` under `src/dtos/requests` and `src/dtos/responses`.

**Functions:**
- Use `camelCase` for functions and class methods (examples: `createApp`, `setupRoutes` in `src/app.ts`; `findRefreshTokenByToken` in `src/services/auth.service.ts`).
- Use arrow-property methods in controllers/services for handler binding (example: `register = async (...) => {}` in `src/controllers/auth.controller.ts`).

**Variables:**
- Use `camelCase` for local variables and params (examples: `existingUser`, `emailVerificationToken`, `rateLimitOptions`).
- Use `UPPER_SNAKE_CASE` for message/status constants (examples in `src/constants/message.constant.ts`, `src/constants/httpStatus.constant.ts`).

**Types:**
- Prefix interfaces with `I` (examples: `IAuthService`, `IAuthController`, `IUsersValidation`).
- Prefix enums with `E` (examples: `ETokenType`, `EUserVerificationStatus`).
- Use DTO classes for transport boundaries (examples in `src/dtos/requests/auth.request.dto.ts`, `src/dtos/responses/auth.response.dto.ts`).

## Code Style

**Formatting:**
- Tool: Prettier (`.prettierrc`).
- Enforced style: single quotes, semicolons, no trailing commas, print width 120, 2 spaces, always parens, `jsxSingleQuote` true.

**Linting:**
- Tool: ESLint flat config (`eslint.config.mts`) + `typescript-eslint` recommended rules.
- Custom severity is mostly warnings (`@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `prettier/prettier`).
- Ignore list: `node_modules`, `dist`.

## Import Organization

**Order:**
1. Internal alias imports (`@/...`)
2. External package imports
3. Type imports often mixed inline

Observed in multiple files (for example `src/app.ts`, `src/services/auth.service.ts`). This order is currently consistent but not auto-enforced by an import-order rule.

**Path Aliases:**
- Primary alias: `@/*` -> `src/*` configured in `tsconfig.json`.

## Error Handling

**Patterns:**
- Throw domain error classes (`BadRequestError`, `NotFoundError`, `AuthFailureError`) from controller/service/validation layers.
- Wrap async route handlers with `asyncHandler` (`src/utils/handler.util.ts`) and centralize response shaping in `errorHandler` (`src/middlewares/error.middleware.ts`).
- Validation failures are mapped and raised via `UnprocessableEntityError` (`src/utils/validation.util.ts`).

## Logging

**Framework:** `pino` + `pino-http` (configured in `src/logger/index.ts`).

**Patterns:**
- Request-scoped logging context middleware (`src/logger/request-context.ts`) attached globally in `src/app.ts`.
- Log unexpected errors in central middleware (`req.log.error({ err }, 'unhandled error')` in `src/middlewares/error.middleware.ts`).

## Comments

**When to Comment:**
- Inline operational comments are used for non-obvious bootstrap/runtime behavior (example queue init warning in `src/app.ts`).
- Existing code includes mixed-language comments and commented-out blocks in core files (`src/controllers/base.controller.ts`, `src/services/base.service.ts`, `src/utils/handler.util.ts`).

**JSDoc/TSDoc:**
- Multi-line doc comments are used in some base abstractions (for example `src/controllers/base.controller.ts`, `src/repositories/base.repository.ts`) but not consistently across feature modules.

## Function Design

**Size:** Feature service/controller methods can be long but are usually single-responsibility per endpoint/use case (`src/controllers/auth.controller.ts`, `src/services/auth.service.ts`).

**Parameters:** Use typed DTOs and explicit intersections for contextual fields (for example `ResetPasswordRequestDTO & { userId: string }` in `src/services/auth.service.ts`).

**Return Values:** Prefer explicit DTO or interface return types; controllers send through shared response wrappers (`OK`, `Created`) from `src/responses/success.response.ts`.

## Module Design

**Exports:**
- Default export for concrete class/factory in many modules (example `export default AuthController`).
- Named exports for interfaces, helper functions, and constants.

**Barrel Files:**
- Limited targeted barrel usage (for example `src/config/index.ts`, `src/database/mongodb/index.ts`, `src/database/redis/index.ts`, `src/queue/index.ts`).
- No single global barrel for the whole app.

## Quality Gates

- Available local checks: `npm run lint`, `npm run lint:fix`, `npm run prettier`, `npm run prettier:fix` (`package.json`).
- No repository-level CI workflow detected under `.github/workflows`.
- No pre-commit hooks or lint-staged configuration detected (`.husky`, `.lintstagedrc*`, `lint-staged.config.*` not present).

## Pragmatic Recommendations (Prioritized)

1. **High:** Make lint/type/format checks blocking in CI (`npm run lint`, `npm run prettier`, `npm run build`) to prevent drift; current checks are optional local commands.
2. **High:** Raise selected lint rules from `warn` to `error` (`no-unused-vars`, `prettier/prettier`) to reduce dead code and formatting drift before merge.
3. **Medium:** Add import-order linting (for example via `eslint-plugin-import`) to enforce deterministic import grouping currently done by convention.
4. **Medium:** Remove commented-out code blocks in core abstractions and keep comments actionable to reduce maintenance noise.
5. **Low:** Standardize comment language and doc comment style for shared readability across team members.

---

*Convention analysis: 2026-03-21*
