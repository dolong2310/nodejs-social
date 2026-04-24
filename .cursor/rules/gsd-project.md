<!-- gsd-project-start source:PROJECT.md -->
## Project

**nodejs-social**

Backend **social + realtime chat** cho ứng dụng kiểu mạng xã hội: người dùng đăng bài, tương tác (like, comment, bookmark), tìm kiếm, media trên **AWS S3**; **đồng thời** có **kết bạn hai chiều** (friend request), **chat trực tiếp và nhóm**, và **trung tâm thông báo** (lưu DB + REST + đẩy qua Socket.IO). Auth dùng **chuẩn dự án hiện tại** (JWT, OAuth Google, …), mở rộng khi thiếu — không sao chép flow auth của project tham chiếu (PingMe).

**Kiến trúc triển khai:** một process HTTP, một port; **module chat** tách code theo bounded context nhưng **không** thêm prefix URL kiểu `/api/chat` — route vẫn dạng `/api/...` như hiện tại. Dữ liệu chat nằm trên **MongoDB cùng cluster, database riêng** (`DATABASE_CHAT_NAME`); dữ liệu social chính giữ database hiện tại.

**Core Value:** Người dùng **kết bạn tin cậy**, **xem feed và tương tác đúng quyền**, và **nhắn tin (1-1 hoặc nhóm) ổn định, có lịch sử và thông báo** — tất cả qua một API thống nhất, bảo mật và nhất quán với codebase TypeScript/Express hiện có.

### Constraints

- **Tech stack:** Giữ TypeScript, Express 5, Mongo native driver, Redis/BullMQ/S3/SES như hiện tại — không nhập Mongoose cho scope chat.
- **URL:** Không thêm segment `chat` vào path; giữ pattern `/api/auth`, `/api/users`, …
- **Process:** Một app, một server HTTP; chat module chỉ tách **code + database**.
- **Dữ liệu followers:** Drop theo quyết định sản phẩm — cần script/migration hoặc xóa collection/indexes có liên quan trong kế hoạch triển khai.
<!-- gsd-project-end -->

<!-- gsd-stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript (strict mode) - API/server code in `src/` with build config in `tsconfig.json`.
- JavaScript (tooling/config runtime) - Node runtime entry and tool configs in `package.json`, `eslint.config.mts`, `nodemon.json`.
- YAML - OpenAPI source files in `swagger/` referenced by `src/app.ts`.
## Runtime
- Node.js (ESM mode via `"type": "module"`) in `package.json`.
- npm (script lifecycle + lockfile workflow).
- Lockfile: present (`package-lock.json`).
## Frameworks
- Express `^5.2.1` - HTTP API framework in `src/app.ts`.
- Socket.IO `^4.8.3` - realtime messaging server in `src/services/socket.service.ts`.
- Not detected (no test runner dependency or `test` script in `package.json`).
- TypeScript compiler `^5.9.3` - transpilation to `dist/` (`build` script).
- `tsc-alias` `^1.8.16` - rewrites TS path aliases after build.
- `tsx` `^4.21.0` + `nodemon` `^3.1.14` - development runtime (`nodemon.json`, `dev` script).
- ESLint `^10.0.2` + typescript-eslint `^8.56.1` + Prettier `^3.8.1` - code quality formatting/linting.
## Key Dependencies
- `mongodb` `^7.1.0` - primary persistent data store in `src/database/mongodb/database.service.ts`.
- `jsonwebtoken` `^9.0.3` + `bcrypt` `^6.0.0` - auth/token/password flow in `src/services/token.service.ts`, `src/services/auth.service.ts`.
- `bullmq` `^5.71.0` - background jobs/workers in `src/queue/`.
- `ioredis` `^5.10.1` - cache, rate-limit store, queue backend in `src/database/redis/` and `src/app.ts`.
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/client-ses`, `@aws-sdk/lib-storage`) - media storage + outbound email in `src/services/s3.service.ts` and `src/services/email.service.ts`.
- `swagger-jsdoc` + `swagger-ui-express` - API docs endpoint `/api/docs` in `src/app.ts`.
- `helmet`, `cors`, `express-rate-limit`, `rate-limit-redis` - transport/security middleware in `src/app.ts`.
## Configuration
- Required env vars are validated at boot in `src/config/envConfig.ts`.
- Example keys are declared in `.env.example` (database, JWT, Google OAuth, AWS, Redis, rate limit, cache TTL).
- TS compiler + alias config in `tsconfig.json`.
- Lint + style rules in `eslint.config.mts`.
- Dev process/watch settings in `nodemon.json`.
## Platform Requirements
- Node.js + npm.
- MongoDB reachable via `DATABASE_URI`.
- Redis reachable via `REDIS_HOST`/`REDIS_PORT`.
- Node.js process running `node dist/main.js --env=production` (`package.json`).
- External infrastructure: MongoDB, Redis, AWS S3, AWS SES, Google OAuth endpoints.
## Build/Test Commands
<!-- gsd-stack-end -->

<!-- gsd-conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use `kebab-case` + suffix by layer: `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.validation.ts`, `*.route.ts` (examples: `src/controllers/auth.controller.ts`, `src/services/auth.service.ts`, `src/repositories/user.repository.ts`, `src/validations/users.validation.ts`, `src/routes/auth.route.ts`).
- Use grouped DTO files by direction: `*.request.dto.ts`, `*.response.dto.ts` under `src/dtos/requests` and `src/dtos/responses`.
- Use `camelCase` for functions and class methods (examples: `createApp`, `setupRoutes` in `src/app.ts`; `findRefreshTokenByToken` in `src/services/auth.service.ts`).
- Use arrow-property methods in controllers/services for handler binding (example: `register = async (...) => {}` in `src/controllers/auth.controller.ts`).
- Use `camelCase` for local variables and params (examples: `existingUser`, `emailVerificationToken`, `rateLimitOptions`).
- Use `UPPER_SNAKE_CASE` for message/status constants (examples in `src/constants/message.constant.ts`, `src/constants/httpStatus.constant.ts`).
- Prefix interfaces with `I` (examples: `IAuthService`, `IAuthController`, `IUserValidation`).
- Prefix enums with `E` (examples: `ETokenType`, `EUserStatus`).
- Use DTO classes for transport boundaries (examples in `src/dtos/requests/auth.request.dto.ts`, `src/dtos/responses/auth.response.dto.ts`).
## Code Style
- Tool: Prettier (`.prettierrc`).
- Enforced style: single quotes, semicolons, no trailing commas, print width 120, 2 spaces, always parens, `jsxSingleQuote` true.
- Tool: ESLint flat config (`eslint.config.mts`) + `typescript-eslint` recommended rules.
- Custom severity is mostly warnings (`@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `prettier/prettier`).
- Ignore list: `node_modules`, `dist`.
## Import Organization
- Primary alias: `@/*` -> `src/*` configured in `tsconfig.json`.
## Error Handling
- Throw domain error classes (`BadRequestError`, `NotFoundError`, `AuthFailureError`) from controller/service/validation layers.
- Wrap async route handlers with `asyncHandler` (`src/utils/handler.util.ts`) and centralize response shaping in `errorHandler` (`src/middlewares/error.middleware.ts`).
- Validation failures are mapped and raised via `UnprocessableEntityError` (`src/utils/validation.util.ts`).
## Logging
- Request-scoped logging context middleware (`src/logger/request-context.ts`) attached globally in `src/app.ts`.
- Log unexpected errors in central middleware (`req.log.error({ err }, 'unhandled error')` in `src/middlewares/error.middleware.ts`).
## Comments
- Inline operational comments are used for non-obvious bootstrap/runtime behavior (example queue init warning in `src/app.ts`).
- Existing code includes mixed-language comments and commented-out blocks in core files (`src/controllers/base.controller.ts`, `src/services/base.service.ts`, `src/utils/handler.util.ts`).
- Multi-line doc comments are used in some base abstractions (for example `src/controllers/base.controller.ts`, `src/repositories/base.repository.ts`) but not consistently across feature modules.
## Function Design
## Module Design
- Default export for concrete class/factory in many modules (example `export default AuthController`).
- Named exports for interfaces, helper functions, and constants.
- Limited targeted barrel usage (for example `src/config/index.ts`, `src/database/mongodb/index.ts`, `src/database/redis/index.ts`, `src/queue/index.ts`).
- No single global barrel for the whole app.
## Quality Gates
- Available local checks: `npm run lint`, `npm run lint:fix`, `npm run prettier`, `npm run prettier:fix` (`package.json`).
- No repository-level CI workflow detected under `.github/workflows`.
- No pre-commit hooks or lint-staged configuration detected (`.husky`, `.lintstagedrc*`, `lint-staged.config.*` not present).
## Pragmatic Recommendations (Prioritized)
<!-- gsd-conventions-end -->

<!-- gsd-architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Feature-oriented HTTP modules under `src/routes/` with one route class per bounded feature.
- Strict call chain from transport to persistence: route -> validation/middleware -> controller -> service -> repository -> MongoDB.
- Infrastructure initialized once at bootstrap (`MongoDB`, `Redis`, `BullMQ`, `Socket.IO`) and reused through singleton wrappers.
## Layers
- Purpose: Initialize process-level dependencies and wire middleware/routers/server lifecycle.
- Location: `src/index.ts`, `src/app.ts`, `src/container/index.ts`
- Contains: server startup, app factory, DI container assembly, graceful shutdown.
- Depends on: config, database/redis singletons, queue singleton, route factories.
- Used by: process entrypoint only (`src/index.ts`).
- Purpose: Expose API routes and realtime message events.
- Location: `src/routes/*.route.ts`, `src/middlewares/*.ts`, `src/services/socket.service.ts`
- Contains: Express route registration, auth/rate-limit/pagination middleware, Socket.IO auth + event handlers.
- Depends on: container-provided controllers/services and middleware utilities.
- Used by: `src/app.ts` via `setupRoutes()` and `SocketService.run()`.
- Purpose: Translate request context to service calls and normalize response envelopes.
- Location: `src/controllers/*.controller.ts`, `src/controllers/base.controller.ts`
- Contains: request parsing, pagination response shaping, cookie helper methods, response codes.
- Depends on: service interfaces and DTOs.
- Used by: route classes (`src/routes/*.route.ts`).
- Purpose: Business orchestration, cross-repository logic, cache/queue integration.
- Location: `src/services/*.service.ts`, `src/services/base.service.ts`
- Contains: domain use-cases (auth/users/posts/search/media/etc), cache invalidation, token operations.
- Depends on: repositories, Redis service, queue producers, S3 service.
- Used by: controllers and selected middleware (`src/middlewares/auth.middleware.ts` for token verification via container token service).
- Purpose: Data access abstraction over Mongo collections and aggregation pipelines.
- Location: `src/repositories/*.repository.ts`, `src/repositories/base.repository.ts`, `src/models/schemas/*.schema.ts`
- Contains: CRUD operations, pagination helpers, text/search aggregation pipelines.
- Depends on: `Database` collections from `src/database/mongodb/database.service.ts`.
- Used by: service layer.
- Purpose: External system adapters and process-scoped resource management.
- Location: `src/database/**`, `src/queue/**`, `src/logger/**`, `src/config/**`
- Contains: Mongo index bootstrap, Redis adapter, BullMQ queues/workers, request-context logging, env/config parsing.
- Depends on: environment configuration and third-party SDKs.
- Used by: bootstrap/app/container and services.
## Data Flow
- Request state is transient in Express request object (`req.tokenPayload`, `req.postDetail`).
- Persistent state is MongoDB.
- Cache state is Redis via cache-aside (`IRedisService.getOrSet`) in services like `src/services/users.service.ts`.
- Ephemeral connection state for realtime users lives in memory map inside `SocketService`.
## Key Abstractions
- Purpose: Centralized object graph creation and lifecycle for repositories/services/controllers/validations.
- Examples: `src/container/index.ts`
- Pattern: Singleton service locator with typed getters.
- Purpose: Standardize route initialization and container access.
- Examples: `src/routes/base.route.ts`, `src/routes/auth.route.ts`, `src/routes/posts.route.ts`
- Pattern: Abstract base class + per-feature subclass + exported factory function.
- Purpose: Keep response structure and pagination logic consistent across endpoints.
- Examples: `src/controllers/base.controller.ts`
- Pattern: Shared controller superclass with helper methods.
- Purpose: Encapsulate Mongo collection operations and object shape constructors.
- Examples: `src/repositories/post.repository.ts`, `src/models/schemas/post.schema.ts`
- Pattern: Repository pattern over native MongoDB driver with DTO-focused projections.
## Entry Points
- Location: `src/index.ts`
- Triggers: `npm run dev` / compiled runtime start scripts from `package.json`.
- Responsibilities: Build `AppConfig`, initialize uploads, call `createApp`, listen on port.
- Location: `src/app.ts`
- Triggers: Called once from `bootstrap()`.
- Responsibilities: Connect infra, initialize queues/container, mount middleware/routes/docs, setup shutdown hooks.
- Location: `src/services/socket.service.ts`
- Triggers: `new SocketService(...).run()` in `src/app.ts`.
- Responsibilities: Socket auth, connection lifecycle, realtime message relay.
## Error Handling
- Route handlers wrapped by `asyncHandler` (`src/utils/handler.util.ts`) to forward async exceptions.
- Domain errors instantiated in services/middleware (`src/responses/error.response.ts`) and handled globally in `src/middlewares/error.middleware.ts`.
- Authentication-specific JWT errors mapped to app-level errors in `src/middlewares/auth.middleware.ts`.
## Cross-Cutting Concerns
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
<!-- gsd-architecture-end -->

<!-- gsd-workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- gsd-workflow-end -->



<!-- gsd-profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- gsd-profile-end -->
