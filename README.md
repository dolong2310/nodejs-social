# NodeJS Social

English | [Tiếng Việt](README.vi.md)

Backend service for a social networking application. The project focuses on user identity, posts, relationships, conversations, notifications, media upload, realtime events, and role-based administration.

This repository is built as a TypeScript backend API, with a clean/hexagonal architecture style so business rules stay separated from HTTP, database, queue, and third-party infrastructure concerns.

## Features

- Email/password authentication with access tokens and refresh-token cookies
- Google OAuth login flow
- OTP email flow and two-factor authentication support
- User profile, password change, and admin user management
- Friend requests, friendships, blocking, and unblocking
- Posts, feeds, hashtags, likes, bookmarks, search, and view tracking
- Conversations, group chat, messages, typing, read state, and realtime presence
- Notifications with realtime delivery and cleanup jobs
- Image upload, video upload, video stream status, and static video streaming
- Role and permission management for protected operations
- Swagger/OpenAPI documentation and Postman collections
- MongoDB and PostgreSQL persistence adapters behind repository ports
- Redis-backed cache/rate-limit support and BullMQ background jobs

## Tech Stack

| Area            | Technology                              |
| --------------- | --------------------------------------- |
| Language        | TypeScript, ESM                         |
| Runtime         | Node.js                                 |
| Package manager | pnpm 11                                 |
| HTTP API        | Express 5                               |
| Realtime        | Socket.IO                               |
| Databases       | MongoDB, PostgreSQL                     |
| Cache / queues  | Redis, BullMQ                           |
| Auth            | JWT, bcrypt, Google OAuth, OTPAuth      |
| Storage / email | AWS S3, AWS SES                         |
| Media           | Sharp, ffmpeg-compatible video pipeline |
| Validation      | Valibot, express-validator-style pipes  |
| Logging         | Pino                                    |
| API docs        | Swagger UI, OpenAPI YAML                |
| Testing         | Vitest, Supertest, tsarch               |
| Container       | Docker                                  |
| Deployment      | GitHub Actions, Render                  |

## Architecture

The codebase follows a layered clean/hexagonal style with vertical feature modules.

```txt
HTTP / Socket.IO
      |
Presentation layer
Routes, controllers, guards, pipes, interceptors
      |
Application layer
Use cases, services, application ports
      |
Domain layer
Entities, value objects, repository contracts
      |
Infrastructure adapters
MongoDB, PostgreSQL, Redis, BullMQ, S3, SES, JWT, Google OAuth
```

Key ideas:

- `src/modules/<feature>/domain` contains business entities, value objects, and repository contracts.
- `src/modules/<feature>/application` contains use cases, application services, and outbound ports.
- `src/modules/<feature>/infrastructure` contains persistence, queue, and service adapters.
- `src/presentation` contains Express and Socket.IO adapters.
- `src/bootstrap` is the composition root that wires repositories, services, routes, workers, and socket features.
- Database-specific code is hidden behind repository ports, allowing MongoDB or PostgreSQL implementations to be selected through configuration.

## Project Structure

```txt
src/
  bootstrap/          Application startup, config, manual DI, route/worker wiring
  infrastructure/     Shared database, Redis, queue, logger, and technical adapters
  modules/            Feature modules using domain/application/infrastructure layers
  presentation/       Express HTTP API and Socket.IO presentation adapters
  index.ts            Process entry point

swagger/              OpenAPI YAML fragments used by Swagger UI
postman/              Postman collections and environment
scripts/              Utility and seed scripts
.github/workflows/    GitHub Actions deployment workflows
Dockerfile            Production container image definition
test/
  architecture/       Architecture boundary tests
  e2e/                End-to-end HTTP tests
  support/            Builders, doubles, and mocks for tests
```

Main modules:

- `authentication`: register, login, refresh token, logout, OTP, 2FA, Google OAuth
- `authorization`: roles and permissions
- `user`: user profile and admin user operations
- `relationship`: friends, friend requests, and blocks
- `post`: posts, feeds, hashtags, likes, bookmarks, and views
- `conversation`: conversations, members, messages, and group operations
- `notification`: notification listing, read state, realtime presence, and cleanup
- `media`: image upload, video upload, stream status, and static video streaming
- `operations`: internal admin/maintenance actions such as cache clearing and permission sync
- `core`: shared DDD primitives, base use-case contracts, repository bases, and app-wide ports

## Getting Started

### Prerequisites

- Node.js. This project is currently developed with Node `v25.3.0`.
- pnpm `11.0.0`
- MongoDB or PostgreSQL
- Redis
- ffmpeg on `PATH` if you want to run video processing flows
- AWS S3/SES credentials for production-like media and email flows

### Install

```bash
pnpm install
```

### Environment

Create a local environment file from the example:

```bash
cp .env.example .env.development
```

Then fill the required variables.

Important variables:

| Variable                                                                         | Purpose                             |
| -------------------------------------------------------------------------------- | ----------------------------------- |
| `PORT`                                                                           | HTTP server port                    |
| `APP_URL`                                                                        | Backend application URL             |
| `FRONTEND_URL`                                                                   | Frontend URL used for CORS defaults |
| `CORS_ORIGINS`                                                                   | Comma-separated allowed origins     |
| `DATABASE_ADAPTER`                                                               | `mongo` or `postgres`               |
| `MONGO_URI`, `MONGO_DB_NAME`                                                     | MongoDB connection config           |
| `POSTGRES_URI`, `POSTGRES_SSL`                                                   | PostgreSQL connection config        |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`                         | Redis connection config             |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`                                    | JWT secrets                         |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`                | Google OAuth config                 |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` | S3 storage config                   |
| `SES_FROM_ADDRESS`                                                               | Sender email for OTP/email flows    |
| `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`                   | API rate limit config               |

Do not commit real `.env.*` secrets.

### Database Migrations

Run the migration for the persistence driver you selected.

MongoDB:

```bash
pnpm run db:migrate:mongo --env=development
```

PostgreSQL:

```bash
pnpm run db:migrate:postgres --env=development
```

Useful migration commands:

```bash
pnpm run db:migrations:pending:mongo --env=development
pnpm run db:migrations:executed:mongo --env=development
pnpm run db:rollback:mongo --env=development

pnpm run db:migrations:pending:postgres --env=development
pnpm run db:migrations:executed:postgres --env=development
pnpm run db:rollback:postgres --env=development
```

### Seed Data

MongoDB:

```bash
pnpm run seed:permissions:mongo
pnpm run seed:create-admin-user:mongo
pnpm run seed:fake-data:mongo
```

PostgreSQL:

```bash
pnpm run seed:permissions:postgres
pnpm run seed:create-admin-user:postgres
pnpm run seed:fake-data:postgres
```

### Run Development Server

```bash
pnpm run dev
```

Other environments:

```bash
pnpm run dev:staging
pnpm run dev:prod
```

The API prefix is:

```txt
/api/v1
```

Swagger UI is available at:

```txt
/api/docs
```

### Build and Run with Docker

The repository includes a production `Dockerfile` based on `node:22-alpine`. The image installs dependencies with pnpm, builds the TypeScript app, and starts it with:

```bash
pnpm start:prod
```

Build the image:

```bash
docker build -t nodejs-social .
```

Run the container with a production environment file:

```bash
docker run --rm --env-file .env.production -p 3000:3000 nodejs-social
```

The container only runs the API process. MongoDB/PostgreSQL, Redis, S3/SES or Cloudinary, and other external services still need to be provided separately.

## Scripts

| Command                      | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| `pnpm run dev`               | Start development server with `.env.development` |
| `pnpm run build`             | Compile TypeScript and rewrite path aliases      |
| `pnpm run build:clean`       | Clean `dist` and rebuild                         |
| `pnpm run start:dev`         | Run compiled app with development env            |
| `pnpm run lint`              | Run ESLint                                       |
| `pnpm run prettier`          | Check formatting                                 |
| `pnpm run typecheck`         | Type-check production build config               |
| `pnpm run typecheck:test`    | Type-check test config                           |
| `pnpm run test`              | Run all configured Vitest tests                  |
| `pnpm run test:unit`         | Run module/unit tests                            |
| `pnpm run test:architecture` | Run architecture boundary tests                  |

## CI/CD

Production deployment is configured in `.github/workflows/deploy-production.yml`.

The workflow runs on:

- Pushes to `main`
- Manual runs through `workflow_dispatch`

Deployment flow:

- Checks out the repository
- Verifies the production Docker build with `docker build --platform linux/amd64 -t nodejs-social:ci .`
- Installs the Render CLI
- Creates a Render deploy for the configured service and waits for completion
- Sends Telegram notifications for success or failure

Required GitHub repository secrets:

| Secret              | Purpose                       |
| ------------------- | ----------------------------- |
| `RENDER_API_KEY`    | Authenticates Render CLI      |
| `RENDER_SERVICE_ID` | Target Render service         |
| `TELEGRAM_TO`       | Telegram chat/user identifier |
| `TELEGRAM_TOKEN`    | Telegram bot token            |

Runtime application environment variables should be configured in Render or the target deployment environment, not committed to the repository.

## API Overview

Routes are mounted under `/api/v1`.

| Area                | Base path                             |
| ------------------- | ------------------------------------- |
| Authentication      | `/api/v1/auth`                        |
| OAuth               | `/api/v1/oauth`                       |
| Users               | `/api/v1/users`                       |
| Admin users         | `/api/v1/admin/users`                 |
| Friends             | `/api/v1/friends`                     |
| Blocks              | `/api/v1/blocks`                      |
| Posts               | `/api/v1/posts`                       |
| Hashtags            | `/api/v1/hashtags`                    |
| Search              | `/api/v1/search`                      |
| Media               | `/api/v1/media`                       |
| Static files        | `/api/v1/static` and `/static/videos` |
| Conversations       | `/api/v1/conversations`               |
| Notifications       | `/api/v1/notifications`               |
| Roles               | `/api/v1/roles`                       |
| Permissions         | `/api/v1/permissions`                 |
| Internal operations | `/api/v1/internal`                    |

Useful docs and collections:

- Swagger UI: `/api/docs`
- Postman collection: [postman/COLLECTION_API.postman.json](./postman/COLLECTION_API.postman.json)
- Postman environment: [postman/ENV.postman.json](./postman/ENV.postman.json)

## Testing Strategy

The project uses Vitest for unit, architecture, integration, and e2e tests.

Current test focus:

- Application use cases in feature modules, especially authentication and user flows
- Architecture boundary tests with `tsarch`
- E2E authentication-user flow through the HTTP layer
- Test support helpers, builders, doubles, and mocks under `test/support`

Run tests:

```bash
pnpm run test
```

Run architecture tests only:

```bash
pnpm run test:architecture
```

The architecture tests help enforce the intended layer direction so domain/application code does not accidentally depend on presentation or infrastructure details.

## Design Decisions

### Clean architecture with feature modules

Each business area is organized as a vertical module. This keeps the domain language close to the use cases while still separating domain, application, and infrastructure responsibilities.

### Manual dependency injection

The project uses an explicit container in `src/bootstrap` instead of a framework-level DI container. This makes object wiring visible and keeps the runtime framework lightweight.

### Repository ports with MongoDB and PostgreSQL adapters

Domain and application code depend on repository contracts, not database clients. The selected persistence driver is configured with `DATABASE_ADAPTER`, and the composition root wires either MongoDB or PostgreSQL implementations.

### Use cases as application entry points

Controllers call application use cases instead of directly orchestrating repositories. This keeps HTTP concerns out of the business workflow and makes use cases easier to test.

### Realtime and background jobs as adapters

Socket.IO features and BullMQ workers are treated as delivery mechanisms around application logic, not as the center of the domain model.

## Current Status

Implemented:

- Core authentication and user flows
- Role and permission management
- Post/feed/social interaction flows
- Friend/block relationship flows
- Conversation and notification modules
- Media upload and video processing pipeline
- MongoDB and PostgreSQL persistence adapters
- Redis, queue, Swagger, and Postman integration
- Docker production image
- GitHub Actions deployment to Render with Docker build verification and Telegram notifications
- Unit, architecture, and e2e test setup

Good next improvements:

- Add Docker Compose for local MongoDB/PostgreSQL/Redis startup
- Add CI quality gates for lint, typecheck, tests, and build
- Add coverage reporting and thresholds
- Expand e2e tests for posts, relationships, conversations, and media
- Document deployment topology, runtime environment setup, and worker scaling strategy

## Engineering Focus

This project is designed to demonstrate:

- Business logic separated from HTTP and database frameworks
- Testable application use cases with explicit dependencies
- Modular backend structure for a social networking domain
- Swappable persistence adapters for MongoDB and PostgreSQL
- Production-oriented concerns such as queues, caching, rate limits, logs, migrations, API docs, Docker deployment, and realtime events
