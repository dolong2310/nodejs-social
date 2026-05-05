# Coding Conventions

**Analysis Date:** 2026-05-02

## Naming Patterns

**Files:**

- **Use cases:** Folder per feature in `kebab-case`; files `*.in-port.ts` (abstract port), `*.interactor.ts` (implementation). Example: `src/modules/auth/application/use-cases/register/register.in-port.ts`, `register.interactor.ts`.
- **HTTP layer:** `*.controller.ts`, `*.route.ts`, `*.pipe.ts` under `src/presentation/http/express/v1/`.
- **Infrastructure:** Mongo implementations often `*.impl.repository.ts`, models `*.model.ts`, mappers `*.mapper.ts` under `src/modules/<module>/infrastructure/`.
- **Exceptions:** `*.exception.ts` (module-level in `application/` or `presentation/http/express/exceptions/`).
- **Config / bootstrap:** `*.config.ts` in `src/bootstrap/config/`.

**Classes and types:**

- **PascalCase** for classes, interfaces, type aliases, enums (e.g. `RegisterInteractor`, `IFriendController`, `EUserStatus`).
- **InPort** suffix for application input ports: abstract classes extending `UseCase` from `src/modules/core/application/base.usecase.ts` (e.g. `RegisterInPort`).
- **Command / Result** naming for DTO-style classes in use case files (e.g. `RegisterCommand`, `RegisterResult` in `register.in-port.ts`).

**Functions and variables:**

- **camelCase** for methods, functions, and variables (e.g. `listFriends`, `getUserId`).
- **UPPER_SNAKE** for module-level constants and some config (e.g. `HTTP_STATUS` in `src/presentation/http/express/responses/http-status.constant.ts`).

**Prefix conventions:**

- Interface names for public contracts often prefixed with `I` when used as DI boundaries (e.g. `IFriendController`, `IUserService` in `src/modules/user/application/services/user.service.ts`).

## Code Style

**Formatting:**

- **Prettier** is the source of truth; settings live in `.prettierrc` and are duplicated in `eslint.config.mts` under the `prettier/prettier` rule so ESLint surfaces format issues.
- **Key settings:** `singleQuote: true`, `semi: true`, `trailingComma: 'none'`, `tabWidth: 2`, `printWidth: 120`, `arrowParens: 'always'`, `useTabs: false`, `endOfLine: 'auto'`.

**Linting:**

- **ESLint** flat config: `eslint.config.mts` using `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-prettier`, Node globals.
- **TypeScript rules:** `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` are **warn**; `@typescript-eslint/no-empty-object-type` is off.
- **Commands:** `npm run lint`, `npm run lint:fix`, `npm run prettier`, `npm run prettier:fix` (see `package.json`).

**TypeScript:**

- **Strict mode** enabled in `tsconfig.json` (`strict: true`).
- **ESM:** `package.json` has `"type": "module"`; `module` / `moduleResolution` set for modern ESM and path aliases.
- **Decorators:** `experimentalDecorators` and `emitDecoratorMetadata` enabled (used for `@AutoBind()` and similar in `src/presentation/http/express/decorators/autoBind.decorator.ts`).

## Import Organization

**Order (typical in this codebase):**

1. **External packages** (e.g. `express`, `jsonwebtoken`).
2. **Internal absolute imports** with the `@/` alias to `src/` (e.g. `@/modules/...`, `@/presentation/...`, `@/bootstrap/...`, `@/infrastructure/...`).

**Path aliases:**

- **`@/*` → `./src/*`** — configured in `tsconfig.json` (`paths`). Build uses `tsc-alias` (`package.json` `build` script) so emitted JS resolves aliases.

**Barrel files:**

- Imports target **concrete module paths**, not aggregate `index.ts` barrels project-wide; prefer explicit paths matching the folder layout above.

## Error Handling

**HTTP API errors:**

- **Subclass hierarchy** from `ErrorResponse` in `src/presentation/http/express/responses/error.response.ts`: carries `statusCode`, `errors` object, used by `errorHandler` in `src/presentation/http/express/middlewares/error.middleware.ts` to return JSON `{ message, errors }`.
- **Unhandled errors** in the global handler log with `req.log.error({ err }, 'unhandled error')` and return 500.

**Domain / application:**

- **`ExceptionBase`** in `src/modules/core/domain/exceptions/exception.base.ts` for normalized codes/metadata (subclass with `code`, optional `metadata`; avoid sensitive data in metadata per file comments).
- **Simpler pattern:** exported **`Error` singletons** thrown by reference (e.g. `UserAlreadyExistsException` in `src/modules/user/application/user.exception.ts`). Presentation-layer equivalents exist under `src/presentation/http/express/exceptions/` (e.g. auth, user, token).

**Express routes:**

- **Wrap async handlers** with `asyncHandler` from `src/presentation/http/express/utils/async-handler.util.ts` so rejected promises call `next(error)`.
- **Validation failures** go through `validate()` in `src/presentation/http/express/utils/validation.util.ts`, which builds `UnprocessableEntityError` with express-validator `mapped()` errors.

**Use case pattern:**

- Interactors **throw** domain/HTTP-flavored errors; they do not send HTTP responses directly (e.g. `throw UserAlreadyExistsException` in `src/modules/auth/application/use-cases/register/register.interactor.ts`).

## Logging

**Framework:** **Pino** (`pino`, `pino-http` in `package.json`). Log level from `src/bootstrap/config/app.config.ts` (`logs.level`, driven by env with dev default `debug`).

**Request context:** **`requestContextLogger`** in `src/infrastructure/logger/request-context-logger.ts` uses **AsyncLocalStorage** for `requestId` / `userId`; middleware binds context; `AuthGuard` syncs `userId` after token verification (`src/presentation/http/express/middlewares/auth.guard.ts`).

**Patterns:**

- Use **`req.log`** in HTTP middleware and error paths where `Request` is available (see `error.middleware.ts`).
- Align new logs with existing structured fields and levels; avoid logging secrets.

## Comments

**When to comment:**

- **User flows** and **numbered steps** appear in interactors (e.g. register flow in `register.interactor.ts`).
- **Vietnamese / English mix** appears in comments for human explanations (config, CORS, rate limit, guards).

**JSDoc / TSDoc:**

- Used selectively on **shared abstractions** (e.g. `ExceptionBase`, `AutoBind` decorator). Not required on every private method.

## Function Design

**Size:** Interactors and controllers stay focused on orchestration; heavy logic tends to live in services, repositories, or utilities.

**Parameters:**

- **Constructor injection** for classes (controllers, routes, guards, interactors via container setup in `src/bootstrap/container.ts`).
- **Command objects** for use case input (`RegisterCommand` with normalized fields in constructor).

**Return values:**

- Use case **`execute`** returns typed **Result** classes or domain shapes; controllers use `BaseController` helpers (`sendResponse`, `sendCursorPaginatedResponse`, etc. in `src/presentation/http/express/v1/controllers/base.controller.ts`).

## Module Design

**Exports:**

- **Named exports** predominate for utilities and middleware; **default export** used for small singletons (e.g. `requestContextLogger`).

**Use case contract:**

- **`UseCase<Request, Response>`** interface in `src/modules/core/application/base.usecase.ts`: `execute(request?: Request): Promise<Response> | Response`.
- Concrete **InPort** abstract class implements that shape per feature; **Interactor** extends InPort and implements `execute`.

**Cross-cutting:**

- **Validation at HTTP boundary:** `express-validator` schemas and `checkSchema` in `src/presentation/http/express/v1/pipes/*.pipe.ts`, composed with `validate()`.
- **Persistence boundary:** **Valibot** schemas in Mongo `*.model.ts` files and `parse()` in mappers (e.g. `src/modules/post/infrastructure/mongo/post.model.ts`, `*.mapper.ts`).

---

*Convention analysis: 2026-05-02*
