# Architecture

**Analysis Date:** 2026-05-02

## Pattern Overview

**Overall:** Layered **hexagonal / clean architecture** with **vertical feature modules** under `src/modules/`, a **shared infrastructure** layer, and **composition-root** wiring in `src/bootstrap/`. HTTP and real-time adapters live in `src/presentation/`.

**Key Characteristics:**
- **Ports and adapters:** Domain defines repository interfaces (ports); `*.impl.repository.ts` in each module’s `infrastructure/mongo/` implements persistence.
- **Use cases as interactors:** Application logic is expressed as `*.interactor.ts` files implementing `UseCase` from `src/modules/core/application/base.usecase.ts`.
- **Manual dependency injection:** A singleton `Container` in `src/bootstrap/container.ts` constructs repositories, application services, interactors, HTTP routes, and socket features in one place; `src/bootstrap/di/http-routes.ts` is the main HTTP composition root.
- **Shared cross-cutting infrastructure:** MongoDB, Redis, BullMQ workers, logging, JWT, S3, email, and file/image helpers live under `src/infrastructure/` (not inside each feature module).

## Layers

**Bootstrap / composition root:**
- Purpose: Application startup, environment config, wiring the container, workers, and graceful shutdown.
- Location: `src/bootstrap/`
- Contains: `create-http-server.ts`, `create-socket-server.ts`, `setup-database.ts`, `setup-redis.ts`, `setup-workers.ts`, `setup-graceful-shutdown.ts`, `container.ts`, `setup-container.ts`, `config/app.config.ts`, `config/env.config.ts`, `di/*`
- Depends on: All other layers (it imports them to construct the graph).
- Used by: `src/index.ts`

**Presentation (adapters — HTTP & WebSocket):**
- Purpose: Translate HTTP/Socket.IO to application calls and back; auth middleware; API versioning; OpenAPI/Swagger.
- Location: `src/presentation/http/express/`, `src/presentation/socket/`
- Contains: `app.ts` (Express factory), `v1/routes/*.route.ts`, `v1/controllers/*.controller.ts`, `v1/dtos/`, `v1/pipes/`, `middlewares/`, `responses/`, `socket.app.ts`, `realtime-emitter.ts`, `features/chat.feature.ts`, `features/presence.feature.ts`
- Depends on: Application layer (interactors via controllers), `IContainer`, token/user services for guards and sockets.
- Used by: Bootstrap when building the HTTP server and socket app.

**Application (per feature module):**
- Purpose: Orchestrate domain and ports; implement use cases and coarse application services.
- Location: `src/modules/<feature>/application/`
- Contains: `use-cases/**/<name>.interactor.ts`, `use-cases/**/<name>.in-port.ts`, `services/*.service.ts`, `ports/*.port.ts` (outbound ports like email, storage), `ports/queries/*`, `ports/command/*` where needed, `*.exception.ts`
- Depends on: Domain ports (repository interfaces), `src/modules/core/application/ports/*` (cache, logger, realtime, hashing, storage abstractions).
- Used by: Presentation controllers and `http-routes.ts` when instantiating interactors.

**Domain (per feature module):**
- Purpose: Entities, value objects, repository contracts, domain-specific types and exceptions.
- Location: `src/modules/<feature>/domain/`
- Contains: `entities/`, `repositories/*.repository.ts` (ports), `value-objects/` where used, types
- Depends on: `src/modules/core/domain/*` (base entity, exceptions, helpers).
- Used by: Application layer and infrastructure mappers.

**Infrastructure (shared technical services):**
- Purpose: MongoDB connection and indexes, Redis client, BullMQ workers, Pino logging, third-party adapters (JWT, S3, SES, hashing, 2FA, Google OAuth helpers).
- Location: `src/infrastructure/persistence/mongodb/database.ts`, `src/infrastructure/persistence/redis/redis.ts`, `src/infrastructure/queue/*`, `src/infrastructure/logger/*`, `src/infrastructure/services/*`
- Depends on: Mongo/Redis drivers, AWS SDK, etc.
- Used by: `Container`, workers, and indirectly by repository implementations.

**Feature infrastructure (per module):**
- Purpose: Mongo models, repository implementations, mappers.
- Location: `src/modules/<feature>/infrastructure/mongo/`, `mappers/`
- Depends on: Mongo `Db`/`Collection`, domain types.
- Used by: `src/bootstrap/di/repositories.ts` when building repository instances passed into `Container`.

**Core module (`src/modules/core/`):**
- Purpose: Shared DDD-style primitives (`Entity`, value object base), shared application ports, base use-case interface, shared repository base for Mongo.
- Location: `src/modules/core/domain/`, `src/modules/core/application/`, `src/modules/core/infrastructure/persistence/repositories/base.mongo.repository.ts`
- Used by: All feature modules.

## Data Flow

**HTTP request (authenticated API):**

1. `src/index.ts` starts `createSocketServer()` then `createHttpServer()` (`src/bootstrap/create-http-server.ts`).
2. Express app from `createExpressApp` (`src/presentation/http/express/app.ts`) mounts routers at `${appConfig.api.prefix}/${version}/${path}` (prefix `/api` from `src/bootstrap/config/app.config.ts`).
3. Route class (`BaseRoute` in `src/presentation/http/express/v1/routes/base.route.ts`) delegates to controller methods.
4. Controller calls an **interactor** constructed in `src/bootstrap/di/http-routes.ts`.
5. Interactor uses **application services** and **repository ports** (interfaces).
6. Repository implementation in `src/modules/<feature>/infrastructure/mongo/*.impl.repository.ts` reads/writes MongoDB via `Db` from `src/infrastructure/persistence/mongodb/database.ts`.
7. Response flows back through controller helpers (`BaseController` in `src/presentation/http/express/v1/controllers/base.controller.ts`) using DTOs under `v1/dtos/`.

**Caching and rate limiting:**
- Redis implements `CacheManagerPort` (`src/modules/core/application/ports/cache-manager.port.ts`); used by services where configured.
- Optional Redis-backed rate limit applies after routes in `create-http-server.ts` when `appConfig.rateLimit.enabled` is true.

**Real-time (Socket.IO):**
- `createSocketApp` (`src/presentation/socket/socket.app.ts`) uses `container.getSocketDeps()` for `tokenService`, `userService`, and feature list.
- Features implement `ISocketFeature` and mount handlers per connection (`src/presentation/socket/features/*.feature.ts`).

**Background jobs:**
- `setupWorkers` (`src/bootstrap/setup-workers.ts`) starts BullMQ workers (`src/infrastructure/queue/email/`, `post-views/`, `notification-trim/`, `video-stream/`) with dependencies from `container.getWorkerDeps()`.

**State Management:**
- No server-side session store for HTTP beyond JWT/cookies as implemented in auth flows; **Redis** used for cache and rate limits; **MongoDB** is system of record; **BullMQ** holds job state.

## Key Abstractions

**`UseCase<Request, Response>`:**
- Purpose: Contract for every interactor’s `execute` method.
- Examples: `src/modules/core/application/base.usecase.ts`
- Pattern: Interactors implement this interface; controllers call `execute`.

**Repository ports (domain):**
- Purpose: Persistence contracts without Mongo types.
- Examples: `src/modules/user/domain/repositories/user.repository.ts`, `src/modules/post/domain/repositories/post.repository.ts`
- Pattern: `*RepositoryPort` or `*Repository` naming; implementations in `infrastructure/mongo/*impl.repository.ts`.

**Application ports (`src/modules/core/application/ports/`):**
- Purpose: Cross-cutting abstractions (cache, logger, realtime emission, hashing, storage) so application code does not import infrastructure directly.
- Examples: `cache-manager.port.ts`, `realtime-emitter.port.ts`, `logger.port.ts`

**`IContainer`:**
- Purpose: Narrow interface for presentation and workers (`getRouters`, `getSocketDeps`, `getWorkerDeps`, `getLogger`).
- Examples: `src/bootstrap/di/types.ts`, implementation `src/bootstrap/container.ts`

**`BaseRoute` / controllers:**
- Purpose: Consistent API surface (`version`, `pathName`, `createRoutes`).
- Examples: `src/presentation/http/express/v1/routes/base.route.ts`, controllers extending `BaseController`

**Domain `Entity<Props>`:**
- Purpose: Rich domain objects with validation and immutability patterns.
- Examples: `src/modules/core/domain/entities/base.entity.ts`

## Entry Points

**Process entry:**
- Location: `src/index.ts`
- Triggers: Node process start (`tsx`/`node` via `package.json` scripts after `tsc` build).
- Responsibilities: Load `reflect-metadata`, create HTTP + Socket.IO server, listen on configured port.

**HTTP server factory:**
- Location: `src/bootstrap/create-http-server.ts`
- Triggers: Called from `bootstrap()` in `src/index.ts`
- Responsibilities: DB + Redis, container, Express app, socket app attachment, optional rate limit, workers, graceful shutdown.

**Socket server factory:**
- Location: `src/bootstrap/create-socket-server.ts`
- Triggers: Called before `createHttpServer` in `src/index.ts`
- Responsibilities: Raw `http.Server` + `socket.io` Server with CORS from `appConfig`.

**Express application:**
- Location: `src/presentation/http/express/app.ts`
- Triggers: `createExpressApp(container)` from `create-http-server.ts`
- Responsibilities: Security headers, JSON, cookies, CORS, logging, mount versioned routers, static video path, Swagger under API prefix, global `errorHandler`.

## Error Handling

**Strategy:** Typed HTTP errors extend `ErrorResponse` (`src/presentation/http/express/responses/error.response.ts`); unknown errors become 500 with Pino logging in `errorHandler` (`src/presentation/http/express/middlewares/error.middleware.ts`).

**Patterns:**
- Controllers and domain/application layers throw or map to `ErrorResponse` / module `*.exception.ts` files where applicable.
- Global Express middleware catches all errors after routes in `app.ts`.

## Cross-Cutting Concerns

**Logging:** Pino via `src/infrastructure/logger/create-logger.ts`, HTTP logging middleware, request context binding (`src/infrastructure/logger/request-context-logger.ts`).

**Validation:** Express-route pipes (validation middleware) under `src/presentation/http/express/v1/pipes/`; Valibot and express-validator appear in dependencies for input validation patterns.

**Authentication:** `AuthGuard` and related middleware (`src/presentation/http/express/middlewares/auth.guard.ts`); JWT verification via `TokenService` / `JwtService` (`src/infrastructure/services/jwt.service.ts`); Socket.IO auth in `socket.app.ts`.

**API documentation:** Swagger UI mounted at `/api/docs` using specs in `swagger/` (`paths.yaml`, `components.yaml`, etc.) referenced from `app.ts`.

---

*Architecture analysis: 2026-05-02*
