# Codebase Structure

**Analysis Date:** 2026-05-02

## Directory Layout

```
nodejs-social/
├── src/
│   ├── index.ts                    # Process entry: HTTP + Socket bootstrap
│   ├── bootstrap/                  # Composition root, config, DI wiring
│   ├── infrastructure/             # Shared persistence, queues, loggers, tech services
│   ├── modules/                    # Feature modules (domain / application / infrastructure)
│   ├── modules-sample/             # Reference samples — excluded from TS build (tsconfig)
│   └── presentation/               # HTTP Express + Socket.IO adapters
├── swagger/                        # OpenAPI YAML fragments for Swagger UI
├── scripts/                        # Operational TS scripts (e.g. seeds, utilities)
├── dist/                           # tsc output (build artifact)
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── nodemon.json
```

## Directory Purposes

**`src/bootstrap/`:**
- Purpose: Start the app, load config, connect Mongo/Redis, build `Container`, register routes and workers.
- Contains: `create-http-server.ts`, `create-socket-server.ts`, `container.ts`, `setup-*.ts`, `config/`, `di/http-routes.ts`, `di/repositories.ts`, `di/queues.ts`, `di/socket-features.ts`, `di/types.ts`
- Key files: `src/bootstrap/container.ts`, `src/bootstrap/di/http-routes.ts`

**`src/infrastructure/`:**
- Purpose: Technology-facing code shared across features (not business rules).
- Contains: `persistence/mongodb/` (`database.ts`, validators), `persistence/redis/`, `persistence/seed/`, `queue/*` (BullMQ workers and connection), `logger/`, `services/` (JWT, S3, email, hashing, OAuth, 2FA, file storage, image processor)
- Key files: `src/infrastructure/persistence/mongodb/database.ts`, `src/infrastructure/logger/create-logger.ts`

**`src/modules/`:**
- Purpose: One folder per bounded context with **domain**, **application**, and **infrastructure** subfolders.
- Contains: Per feature — `domain/`, `application/use-cases/`, `application/services/`, `application/ports/`, `infrastructure/mongo/`, `infrastructure/mappers/`
- Feature modules: `auth`, `block`, `bookmark`, `common`, `conversation`, `core`, `friend`, `hashtag`, `like`, `media`, `notification`, `permission`, `post`, `role`, `user`
- Key files: `src/modules/core/domain/entities/base.entity.ts`, `src/modules/core/application/base.usecase.ts`

**`src/modules/common/`:**
- Purpose: Small shared utilities/constants for modules (e.g. socket helpers) — not the same as `core` (DDD primitives).

**`src/presentation/`:**
- Purpose: Express routes, controllers, DTOs, pipes (validation middleware), middleware, HTTP responses; Socket.IO app and realtime features.
- Contains: `http/express/app.ts`, `v1/routes/`, `v1/controllers/`, `v1/dtos/`, `middlewares/`, `socket/`
- Key files: `src/presentation/http/express/app.ts`, `src/presentation/socket/socket.app.ts`

**`src/modules-sample/`:**
- Purpose: Alternate/sample vertical-slice layout and pedagogy; **excluded** from compilation via `tsconfig.json` `exclude`.
- Generated: No
- Committed: Yes (as reference only)

**`swagger/`:**
- Purpose: YAML specs consumed by `swagger-jsdoc` in `src/presentation/http/express/app.ts`.

**`scripts/`:**
- Purpose: CLI-style scripts run with `tsx` (seeding, maintenance) — see `package.json` `seed:*` scripts.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Bootstraps servers and listens on port.

**Configuration:**
- `src/bootstrap/config/app.config.ts`: Runtime app config (port, JWT shape, `/api` prefix, CORS, rate limit, logging level).
- `src/bootstrap/config/env.config.ts`: Environment variable mapping (do not commit secrets; use `.env` locally — file may exist but is not part of structure docs).
- `tsconfig.json`: Path alias `@/*` → `./src/*`, `exclude` for `src/modules-sample/**/*`.

**Core Logic:**
- Use cases: `src/modules/*/application/use-cases/**/*.interactor.ts`
- Application services: `src/modules/*/application/services/*.service.ts`
- HTTP wiring: `src/bootstrap/di/http-routes.ts`

**Persistence:**
- Connection and indexes: `src/infrastructure/persistence/mongodb/database.ts`
- Redis: `src/infrastructure/persistence/redis/redis.ts`

**Testing:**
- Vitest is configured (`vitest.config.ts`, `npm test` in `package.json` references `tests/setup/register-argv.mjs`); add tests under a `tests/` tree or co-located `*.test.ts` as the project adopts them.

## Naming Conventions

**Files:**
- Use cases: `<action>.interactor.ts` with matching `<action>.in-port.ts` for the input port type when present.
- Repositories: `*.repository.ts` (port), `*.impl.repository.ts` (Mongo implementation).
- Controllers/routes: `*.controller.ts`, `*.route.ts`.
- Exceptions: `*.exception.ts` at module or presentation level.

**Directories:**
- Feature modules: lowercase single word (`user`, `post`, `conversation`).
- Use-case folders: kebab-case action folders (`get-me`, `send-message`, `create-post`).

**Imports:**
- Use path alias `@/` for all `src/` imports (e.g. `@/modules/user/...`).

## Where to Add New Code

**New HTTP feature (new resource or action):**
1. Add or extend **domain** ports under `src/modules/<feature>/domain/repositories/`.
2. Implement **Mongo repository** in `src/modules/<feature>/infrastructure/mongo/` and register in `src/bootstrap/di/repositories.ts`.
3. Add **interactor** under `src/modules/<feature>/application/use-cases/<action>/`.
4. Wire **controller** method and **route** in `src/presentation/http/express/v1/` and register the interactor in `src/bootstrap/di/http-routes.ts` (follow existing patterns for `AuthRoute`, `UserRoute`, etc.).
5. Add Swagger fragments under `swagger/` and DTOs/pipes under `v1/dtos/` and `v1/pipes/`.

**New module (bounded context):**
- Create `src/modules/<name>/{domain,application,infrastructure}` mirroring an existing module such as `src/modules/block/` or `src/modules/bookmark/`.
- Register repositories and services in `src/bootstrap/di/repositories.ts` and `src/bootstrap/container.ts` as needed, then expose HTTP via `http-routes.ts`.

**Utilities:**
- Cross-feature domain primitives: `src/modules/core/domain/` or `src/modules/core/application/ports/`.
- Shared non-domain helpers: `src/modules/common/utils/` or a small dedicated module.

**Socket behavior:**
- New realtime feature: add a class under `src/presentation/socket/features/`, implement `ISocketFeature` (`src/presentation/socket/socket.type.ts`), register in `src/bootstrap/di/socket-features.ts`.

**Background jobs:**
- New worker: add under `src/infrastructure/queue/<name>/`, start from `src/bootstrap/setup-workers.ts`, extend `getWorkerDeps()` in `src/bootstrap/di/types.ts` and `src/bootstrap/container.ts` if new dependencies are required.

## Special Directories

**`dist/`:**
- Purpose: TypeScript compile output for production starts (`npm run build`).
- Generated: Yes
- Committed: Typically no (verify `.gitignore`)

**`.planning/`:**
- Purpose: GSD planning and codebase map artifacts for agents and humans.
- Generated: By workflow tools
- Committed: Per team policy

---

*Structure analysis: 2026-05-02*
