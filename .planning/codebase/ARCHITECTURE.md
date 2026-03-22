# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Layered modular monolith (Express API) with manual dependency injection and singleton infrastructure services.

**Key Characteristics:**
- Feature-oriented HTTP modules under `src/routes/` with one route class per bounded feature.
- Strict call chain from transport to persistence: route -> validation/middleware -> controller -> service -> repository -> MongoDB.
- Infrastructure initialized once at bootstrap (`MongoDB`, `Redis`, `BullMQ`, `Socket.IO`) and reused through singleton wrappers.

## Layers

**Bootstrap & Composition Layer:**
- Purpose: Initialize process-level dependencies and wire middleware/routers/server lifecycle.
- Location: `src/index.ts`, `src/app.ts`, `src/container/index.ts`
- Contains: server startup, app factory, DI container assembly, graceful shutdown.
- Depends on: config, database/redis singletons, queue singleton, route factories.
- Used by: process entrypoint only (`src/index.ts`).

**Transport Layer (HTTP + Socket):**
- Purpose: Expose API routes and realtime message events.
- Location: `src/routes/*.route.ts`, `src/middlewares/*.ts`, `src/services/socket.service.ts`
- Contains: Express route registration, auth/rate-limit/pagination middleware, Socket.IO auth + event handlers.
- Depends on: container-provided controllers/services and middleware utilities.
- Used by: `src/app.ts` via `setupRoutes()` and `SocketService.run()`.

**Controller Layer:**
- Purpose: Translate request context to service calls and normalize response envelopes.
- Location: `src/controllers/*.controller.ts`, `src/controllers/base.controller.ts`
- Contains: request parsing, pagination response shaping, cookie helper methods, response codes.
- Depends on: service interfaces and DTOs.
- Used by: route classes (`src/routes/*.route.ts`).

**Service Layer:**
- Purpose: Business orchestration, cross-repository logic, cache/queue integration.
- Location: `src/services/*.service.ts`, `src/services/base.service.ts`
- Contains: domain use-cases (auth/users/posts/search/media/etc), cache invalidation, token operations.
- Depends on: repositories, Redis service, queue producers, S3 service.
- Used by: controllers and selected middleware (`src/middlewares/auth.middleware.ts` for token verification via container token service).

**Persistence Layer:**
- Purpose: Data access abstraction over Mongo collections and aggregation pipelines.
- Location: `src/repositories/*.repository.ts`, `src/repositories/base.repository.ts`, `src/models/schemas/*.schema.ts`
- Contains: CRUD operations, pagination helpers, text/search aggregation pipelines.
- Depends on: `DatabaseService` collections from `src/database/mongodb/database.service.ts`.
- Used by: service layer.

**Infrastructure Layer:**
- Purpose: External system adapters and process-scoped resource management.
- Location: `src/database/**`, `src/queue/**`, `src/logger/**`, `src/config/**`
- Contains: Mongo index bootstrap, Redis adapter, BullMQ queues/workers, request-context logging, env/config parsing.
- Depends on: environment configuration and third-party SDKs.
- Used by: bootstrap/app/container and services.

## Data Flow

**HTTP Request Flow (Core API):**

1. `src/app.ts` mounts feature routers under `/api` and global middleware (helmet/json/cookie/rate-limit/logging).
2. A route class (example `src/routes/posts.route.ts`) composes middleware, validation, and controller handlers.
3. Controller (example `src/controllers/posts.controller.ts`) extracts params/user context and calls a service.
4. Service (example `src/services/posts.service.ts`) orchestrates repository calls and cross-service dependencies.
5. Repository (example `src/repositories/post.repository.ts`) executes Mongo queries/aggregations and returns entities/DTOs.
6. Controller returns standardized success payload through `BaseController.sendResponse` or pagination helper.

**Background Work Flow (Async Processing):**

1. Bootstrap initializes `QueueService` in `src/app.ts`.
2. Container pulls queue producers from `QueueService.get()` in `src/container/index.ts`.
3. Services enqueue jobs (e.g., email/video processing via `src/queue/queues/*.queue.ts`).
4. BullMQ workers from `src/queue/workers/*.worker.ts` process jobs asynchronously.

**Realtime Flow (Socket):**

1. `SocketService` attaches to `HttpServer` in `src/app.ts`.
2. Middleware in `src/services/socket.service.ts` verifies access token and loads user state.
3. Connection handler stores `userId -> socketId` map and relays events (`sendMessage` -> `receiveMessage`).

**State Management:**
- Request state is transient in Express request object (`req.tokenPayload`, `req.postDetail`).
- Persistent state is MongoDB.
- Cache state is Redis via cache-aside (`IRedisService.getOrSet`) in services like `src/services/users.service.ts`.
- Ephemeral connection state for realtime users lives in memory map inside `SocketService`.

## Key Abstractions

**Dependency Injection Container:**
- Purpose: Centralized object graph creation and lifecycle for repositories/services/controllers/validations.
- Examples: `src/container/index.ts`
- Pattern: Singleton service locator with typed getters.

**Base Route + Route Factory:**
- Purpose: Standardize route initialization and container access.
- Examples: `src/routes/base.route.ts`, `src/routes/auth.route.ts`, `src/routes/posts.route.ts`
- Pattern: Abstract base class + per-feature subclass + exported factory function.

**Base Controller Response Contract:**
- Purpose: Keep response structure and pagination logic consistent across endpoints.
- Examples: `src/controllers/base.controller.ts`
- Pattern: Shared controller superclass with helper methods.

**Repository + Schema Pairing:**
- Purpose: Encapsulate Mongo collection operations and object shape constructors.
- Examples: `src/repositories/post.repository.ts`, `src/models/schemas/post.schema.ts`
- Pattern: Repository pattern over native MongoDB driver with DTO-focused projections.

## Entry Points

**Process Entry Point:**
- Location: `src/index.ts`
- Triggers: `npm run dev` / compiled runtime start scripts from `package.json`.
- Responsibilities: Build `AppConfig`, initialize uploads, call `createApp`, listen on port.

**App Factory:**
- Location: `src/app.ts`
- Triggers: Called once from `bootstrap()`.
- Responsibilities: Connect infra, initialize queues/container, mount middleware/routes/docs, setup shutdown hooks.

**Realtime Entry Point:**
- Location: `src/services/socket.service.ts`
- Triggers: `new SocketService(...).run()` in `src/app.ts`.
- Responsibilities: Socket auth, connection lifecycle, realtime message relay.

## Error Handling

**Strategy:** Centralized middleware + typed domain errors.

**Patterns:**
- Route handlers wrapped by `asyncHandler` (`src/utils/handler.util.ts`) to forward async exceptions.
- Domain errors instantiated in services/middleware (`src/responses/error.response.ts`) and handled globally in `src/middlewares/error.middleware.ts`.
- Authentication-specific JWT errors mapped to app-level errors in `src/middlewares/auth.middleware.ts`.

## Cross-Cutting Concerns

**Logging:** Pino logger and HTTP logger in `src/logger/index.ts`, request correlation in `src/logger/request-context.ts`.
**Validation:** Input checks via feature validators in `src/validations/*.validation.ts` and middleware ordering in route definitions.
**Authentication:** JWT token verification in `src/middlewares/auth.middleware.ts` and socket handshake validation in `src/services/socket.service.ts`.

## Coupling Hotspots

- `src/container/index.ts` is a high-coupling composition root; adding or changing dependencies requires edits in multiple initialization sections.
- `src/app.ts` directly imports and mounts all route factories, making API surface changes centralized but tightly coupled to bootstrap.
- `src/repositories/post.repository.ts` concentrates complex aggregation/business projection logic, increasing risk and change blast radius for feed-related features.
- `src/services/socket.service.ts` performs auth + connection state + event behavior in one class, coupling realtime transport with user auth/business constraints.

## Architectural Strengths

- Clear layer boundaries and consistent per-feature module shape (`route/controller/service/repository`) across `src/`.
- Strong startup discipline: infra connect + index initialization + graceful shutdown handled in one place (`src/app.ts` and `src/database/mongodb/database.service.ts`).
- Typed contracts via DTOs/interfaces reduce accidental runtime shape drift between layers.
- Cache and queue integrations are explicit at service level, making side effects discoverable.

## Architectural Weaknesses

- Service locator singleton (`Container`) hides explicit constructor wiring at module boundaries and can make testing/mocking harder without reset logic.
- Some flows duplicate token-validation logic across HTTP middleware and Socket middleware (`src/middlewares/auth.middleware.ts`, `src/services/socket.service.ts`).
- Domain logic mixed into repository aggregation projections (especially posts/search concerns) increases persistence-layer complexity.
- Realtime message path currently keeps transient user mapping in-memory (`Map` in `SocketService`), which does not scale horizontally without shared state.

---

*Architecture analysis: 2026-03-21*
