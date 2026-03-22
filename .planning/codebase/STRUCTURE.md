# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```text
nodejs-social/
├── src/                 # Application source code (API, services, data, infra adapters)
├── swagger/             # OpenAPI YAML fragments and docs composition files
├── scripts/             # Utility scripts for local data/testing tasks
├── uploads/             # Runtime file storage for media assets
├── dist/                # TypeScript build output
├── my-docs/             # Project-local documentation artifacts
├── package.json         # Scripts and dependency manifest
├── tsconfig.json        # TS compiler + path alias config
├── eslint.config.mts    # Lint rules and TypeScript ESLint setup
└── nodemon.json         # Development process restart configuration
```

## Directory Purposes

**`src/config`:**
- Purpose: Load environment variables and produce typed runtime configuration.
- Contains: env parsing and normalized config objects.
- Key files: `src/config/envConfig.ts`, `src/config/generalConfig.ts`, `src/config/index.ts`

**`src/container`:**
- Purpose: Manual dependency injection composition root.
- Contains: singleton container and typed service/repository/controller getters.
- Key files: `src/container/index.ts`

**`src/routes`:**
- Purpose: Feature route registration and middleware chaining.
- Contains: one class per route module inheriting `BaseRoute`.
- Key files: `src/routes/base.route.ts`, `src/routes/auth.route.ts`, `src/routes/posts.route.ts`

**`src/controllers`:**
- Purpose: HTTP-facing orchestration and response shaping.
- Contains: feature controllers and shared base response helpers.
- Key files: `src/controllers/base.controller.ts`, `src/controllers/auth.controller.ts`, `src/controllers/posts.controller.ts`

**`src/services`:**
- Purpose: Business logic, cross-module orchestration, cache/queue/s3 interaction.
- Contains: feature services, socket service, token utilities.
- Key files: `src/services/auth.service.ts`, `src/services/posts.service.ts`, `src/services/socket.service.ts`

**`src/repositories`:**
- Purpose: MongoDB read/write and aggregation logic.
- Contains: feature repositories and shared repository helper base class.
- Key files: `src/repositories/base.repository.ts`, `src/repositories/post.repository.ts`, `src/repositories/user.repository.ts`

**`src/models/schemas`:**
- Purpose: Data model interfaces and schema constructors used by repositories.
- Contains: user/post/follower/bookmark/conversation/etc schema definitions.
- Key files: `src/models/schemas/user.schema.ts`, `src/models/schemas/post.schema.ts`

**`src/database`:**
- Purpose: Database and cache infrastructure wrappers.
- Contains: Mongo singleton/index bootstrap and Redis singleton/client wrapper.
- Key files: `src/database/mongodb/database.service.ts`, `src/database/redis/redis.service.ts`

**`src/queue`:**
- Purpose: Background job producers/workers and queue lifecycle management.
- Contains: queue service singleton, queue classes, worker implementations.
- Key files: `src/queue/index.ts`, `src/queue/queues/email.queue.ts`, `src/queue/workers/video-hls.worker.ts`

**`src/middlewares`:**
- Purpose: Cross-route request guards and request-shaping middleware.
- Contains: auth, error, pagination, limiter middleware.
- Key files: `src/middlewares/auth.middleware.ts`, `src/middlewares/error.middleware.ts`

**`src/validations`:**
- Purpose: Feature-specific validation middleware for request payload/params.
- Contains: auth/users/posts/search validation modules.
- Key files: `src/validations/auth.validation.ts`, `src/validations/posts.validation.ts`

## Key File Locations

**Entry Points:**
- `src/index.ts`: Process bootstrap and HTTP server start.
- `src/app.ts`: Application factory; mounts middleware/routes/docs and infra lifecycle.

**Configuration:**
- `src/config/envConfig.ts`: Environment loading and required key enforcement.
- `src/config/generalConfig.ts`: Canonical runtime config object.
- `tsconfig.json`: TypeScript compile target and `@/*` alias mapping.

**Core Logic:**
- `src/container/index.ts`: Dependency graph construction.
- `src/services/*.service.ts`: Feature business rules.
- `src/repositories/*.repository.ts`: Persistence logic and Mongo pipelines.

**Testing:**
- `scripts/test-users.ts`: Script-based data/test utility.
- `scripts/fake-data.ts`: Local seeding/fake data helper.
- No dedicated test framework config detected in root (no `jest.config.*` or `vitest.config.*` found).

## Naming Conventions

**Files:**
- Feature modules use suffix-based naming: `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.validation.ts`.
- DTO files split by request/response under `src/dtos/requests/` and `src/dtos/responses/`.
- Schema files use `*.schema.ts` under `src/models/schemas/`.

**Directories:**
- Layer-driven top-level folders under `src/` (e.g., `routes`, `controllers`, `services`, `repositories`).
- Cross-cutting utilities grouped by concern (`constants`, `middlewares`, `logger`, `utils`).

## Module Boundaries & Topology Guidance

**HTTP Feature Boundary:**
- Keep feature API wiring in `src/routes/<feature>.route.ts`.
- Keep protocol-level adaptation in `src/controllers/<feature>.controller.ts`.
- Keep business logic and side-effect orchestration in `src/services/<feature>.service.ts`.
- Keep data querying/mutation in `src/repositories/<feature>.repository.ts`.

**Infrastructure Boundary:**
- Put new external resource lifecycle code in `src/database/` or `src/queue/`.
- Wire new infra into startup flow in `src/app.ts` and expose through `src/container/index.ts` only after initialization.

**Realtime Boundary:**
- Keep Socket.IO handshake and event transport in `src/services/socket.service.ts`.
- Keep persistence-heavy message/conversation business logic in dedicated services/repositories rather than inline socket handlers.

## Where to Add New Code

**New Feature:**
- Primary code: `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`, `src/validations/` using matching `<feature>` filename stem.
- DTO/models: `src/dtos/requests/`, `src/dtos/responses/`, `src/models/schemas/` as needed.
- Tests/scripts: place script-style verification in `scripts/` until a formal test runner is introduced.

**New Component/Module:**
- Implementation: add to the layer-specific directory under `src/` and register dependencies in `src/container/index.ts`.

**Utilities:**
- Shared helpers: `src/utils/`.
- Shared constants/enums: `src/constants/` and `src/enums/`.
- Shared types: `src/types/` or `src/type.d.ts` for global declaration augmentation.

## Folder-Level Coupling Notes

- `src/app.ts` is the central topology hub; it imports every route and infra module, so cross-cutting changes should start there.
- `src/container/index.ts` is the dependency hub; introducing a new service/repository/controller requires synchronized edits in initialization and getter sections.
- `src/repositories/post.repository.ts` is a high-density module with large aggregation pipelines; prefer extracting pipeline builder helpers into `src/utils/` when extending feed logic.

## Special Directories

**`dist/`:**
- Purpose: Compiled JavaScript output.
- Generated: Yes.
- Committed: Yes (present in repository).

**`uploads/`:**
- Purpose: Runtime media storage (images/videos/HLS artifacts).
- Generated: Yes.
- Committed: Yes (directory present).

**`swagger/`:**
- Purpose: API documentation source files consumed by Swagger setup in `src/app.ts`.
- Generated: No.
- Committed: Yes.

**`.planning/codebase/`:**
- Purpose: Generated architecture/quality/tech mapping documents for planning/execution workflows.
- Generated: Yes.
- Committed: Yes (workspace planning artifacts).

---

*Structure analysis: 2026-03-21*
