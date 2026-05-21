# NodeJS Social

Dịch vụ backend cho một ứng dụng mạng xã hội. Dự án tập trung vào định danh người dùng, bài viết, quan hệ bạn bè, hội thoại, thông báo, upload media, realtime event và quản trị phân quyền.

Repository này được xây dựng như một TypeScript backend API, theo hướng clean/hexagonal architecture để tách business rule khỏi HTTP, database, queue và các hạ tầng bên ngoài.

## Tính năng

- Đăng ký/đăng nhập bằng email và mật khẩu với access token và refresh-token cookie
- Đăng nhập bằng Google OAuth
- Luồng OTP email và hỗ trợ xác thực hai lớp
- Hồ sơ người dùng, đổi mật khẩu và quản trị người dùng
- Gửi/lọc/chấp nhận/từ chối lời mời kết bạn, kết bạn, chặn và bỏ chặn người dùng
- Bài viết, bảng tin, hashtag, lượt thích, bookmark, tìm kiếm và tracking lượt xem
- Hội thoại, group chat, tin nhắn, typing, trạng thái đã đọc và realtime presence
- Thông báo với realtime delivery và background cleanup jobs
- Upload ảnh, upload video, kiểm tra trạng thái xử lý video và static video streaming
- Quản lý role và permission cho các thao tác được bảo vệ
- Swagger/OpenAPI documentation và Postman collections
- Adapter persistence cho MongoDB và PostgreSQL thông qua repository ports
- Hỗ trợ cache/rate-limit bằng Redis và background jobs bằng BullMQ

## Công nghệ sử dụng

| Nhóm            | Công nghệ                               |
| --------------- | --------------------------------------- |
| Ngôn ngữ        | TypeScript, ESM                         |
| Runtime         | Node.js                                 |
| Package manager | pnpm 11                                 |
| HTTP API        | Express 5                               |
| Realtime        | Socket.IO                               |
| Database        | MongoDB, PostgreSQL                     |
| Cache / queue   | Redis, BullMQ                           |
| Authentication  | JWT, bcrypt, Google OAuth, OTPAuth      |
| Storage / email | AWS S3, AWS SES                         |
| Media           | Sharp, ffmpeg-compatible video pipeline |
| Validation      | Valibot, express-validator-style pipes  |
| Logging         | Pino                                    |
| API docs        | Swagger UI, OpenAPI YAML                |
| Testing         | Vitest, Supertest, tsarch               |

## Kiến trúc

Codebase đi theo hướng layered clean/hexagonal architecture với các feature module theo chiều dọc.

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

Các ý chính:

- `src/modules/<feature>/domain` chứa business entities, value objects và repository contracts.
- `src/modules/<feature>/application` chứa use cases, application services và outbound ports.
- `src/modules/<feature>/infrastructure` chứa persistence, queue và service adapters.
- `src/presentation` chứa Express và Socket.IO adapters.
- `src/bootstrap` là composition root, chịu trách nhiệm wiring repositories, services, routes, workers và socket features.
- Code phụ thuộc database được ẩn sau repository ports, cho phép chọn MongoDB hoặc PostgreSQL thông qua cấu hình.

## Cấu trúc dự án

```txt
src/
  bootstrap/          Khởi động app, config, manual DI, wiring route/worker
  infrastructure/     Database, Redis, queue, logger và technical adapters dùng chung
  modules/            Feature modules theo domain/application/infrastructure layers
  presentation/       Express HTTP API và Socket.IO presentation adapters
  index.ts            Process entry point

swagger/              OpenAPI YAML fragments dùng bởi Swagger UI
postman/              Postman collections và environment
scripts/              Utility và seed scripts
test/
  architecture/       Architecture boundary tests
  e2e/                End-to-end HTTP tests
  support/            Builders, doubles và mocks cho tests
```

Các module chính:

- `authentication`: register, login, refresh token, logout, OTP, 2FA, Google OAuth
- `authorization`: roles và permissions
- `user`: user profile và admin user operations
- `relationship`: friends, friend requests và blocks
- `post`: posts, feeds, hashtags, likes, bookmarks và views
- `conversation`: conversations, members, messages và group operations
- `notification`: notification listing, read state, realtime presence và cleanup
- `media`: image upload, video upload, stream status và static video streaming
- `operations`: các thao tác admin/maintenance nội bộ như clear cache và sync permission
- `core`: DDD primitives dùng chung, base use-case contracts, repository bases và app-wide ports

## Chạy dự án

### Yêu cầu

- Node.js. Dự án hiện đang được phát triển với Node `v25.3.0`.
- pnpm `11.0.0`
- MongoDB hoặc PostgreSQL
- Redis
- ffmpeg trong `PATH` nếu muốn chạy các luồng xử lý video
- AWS S3/SES credentials nếu muốn chạy media/email flow giống production

### Cài đặt

```bash
pnpm install
```

### Environment

Tạo file environment local từ file mẫu:

```bash
cp .env.example .env.development
```

Sau đó điền các biến môi trường cần thiết.

Các biến quan trọng:

| Biến                                                                             | Mục đích                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------- |
| `PORT`                                                                           | Port của HTTP server                      |
| `APP_URL`                                                                        | URL của backend application               |
| `FRONTEND_URL`                                                                   | URL frontend dùng cho CORS mặc định       |
| `CORS_ORIGINS`                                                                   | Danh sách origin, phân tách bằng dấu phẩy |
| `PERSISTENCE_DRIVER`                                                             | `mongo` hoặc `postgres`                   |
| `MONGO_URI`, `MONGO_DB_NAME`                                                     | Cấu hình kết nối MongoDB                  |
| `POSTGRES_URI`, `POSTGRES_SSL`                                                   | Cấu hình kết nối PostgreSQL               |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`                         | Cấu hình kết nối Redis                    |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`                                    | JWT secrets                               |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`                | Cấu hình Google OAuth                     |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` | Cấu hình S3 storage                       |
| `SES_FROM_ADDRESS`                                                               | Email sender cho OTP/email flows          |
| `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`                   | Cấu hình API rate limit                   |

Không commit secret thật trong các file `.env.*`.

### Database Migrations

Chạy migration tương ứng với persistence driver bạn chọn.

MongoDB:

```bash
pnpm run db:migrate:mongo --env=development
```

PostgreSQL:

```bash
pnpm run db:migrate:postgres --env=development
```

Một số lệnh migration hữu ích:

```bash
pnpm run db:migrations:pending:mongo --env=development
pnpm run db:migrations:executed:mongo --env=development
pnpm run db:rollback:mongo --env=development

pnpm run db:migrations:pending:postgres --env=development
pnpm run db:migrations:executed:postgres --env=development
pnpm run db:rollback:postgres --env=development
```

Xem thêm tại [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md).

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

### Chạy development server

```bash
pnpm run dev
```

Các environment khác:

```bash
pnpm run dev:staging
pnpm run dev:prod
```

API prefix:

```txt
/api/v1
```

Swagger UI:

```txt
/api/docs
```

## Scripts

| Lệnh                         | Mô tả                                          |
| ---------------------------- | ---------------------------------------------- |
| `pnpm run dev`               | Chạy development server với `.env.development` |
| `pnpm run build`             | Compile TypeScript và rewrite path aliases     |
| `pnpm run build:clean`       | Xóa `dist` rồi build lại                       |
| `pnpm run start:dev`         | Chạy compiled app với development env          |
| `pnpm run lint`              | Chạy ESLint                                    |
| `pnpm run prettier`          | Kiểm tra format                                |
| `pnpm run typecheck`         | Type-check production build config             |
| `pnpm run typecheck:test`    | Type-check test config                         |
| `pnpm run test`              | Chạy toàn bộ Vitest tests đã cấu hình          |
| `pnpm run test:unit`         | Chạy module/unit tests                         |
| `pnpm run test:architecture` | Chạy architecture boundary tests               |

## Tổng quan API

Routes được mount dưới `/api/v1`.

| Khu vực             | Base path                            |
| ------------------- | ------------------------------------ |
| Authentication      | `/api/v1/auth`                       |
| OAuth               | `/api/v1/oauth`                      |
| Users               | `/api/v1/users`                      |
| Admin users         | `/api/v1/admin/users`                |
| Friends             | `/api/v1/friends`                    |
| Blocks              | `/api/v1/blocks`                     |
| Posts               | `/api/v1/posts`                      |
| Hashtags            | `/api/v1/hashtags`                   |
| Search              | `/api/v1/search`                     |
| Media               | `/api/v1/media`                      |
| Static files        | `/api/v1/static` và `/static/videos` |
| Conversations       | `/api/v1/conversations`              |
| Notifications       | `/api/v1/notifications`              |
| Roles               | `/api/v1/roles`                      |
| Permissions         | `/api/v1/permissions`                |
| Internal operations | `/api/v1/internal`                   |

Tài liệu và collection hữu ích:

- Swagger UI: `/api/docs`
- Postman collection: [postman/nodejs-social.postman_collection.json](./postman/nodejs-social.postman_collection.json)
- Postman environment: [postman/nodejs-social.postman_environment.json](./postman/nodejs-social.postman_environment.json)
- Admin users collection: [postman/admin-users.postman_collection.json](./postman/admin-users.postman_collection.json)

## Chiến lược testing

Dự án dùng Vitest cho unit, architecture, integration và e2e tests.

Các trọng tâm test hiện tại:

- Application use cases trong các feature modules, đặc biệt là authentication và user flows
- Architecture boundary tests bằng `tsarch`
- E2E authentication-user flow đi qua HTTP layer
- Test support helpers, builders, doubles và mocks trong `test/support`

Chạy tests:

```bash
pnpm run test
```

Chạy riêng architecture tests:

```bash
pnpm run test:architecture
```

Architecture tests giúp đảm bảo hướng phụ thuộc giữa các layer, tránh để domain/application code phụ thuộc ngược vào presentation hoặc infrastructure details.

## Design Decisions

### Clean architecture với feature modules

Mỗi business area được tổ chức thành một module theo chiều dọc. Cách này giữ domain language gần với use cases, đồng thời vẫn tách rõ domain, application và infrastructure responsibilities.

### Manual dependency injection

Dự án dùng container rõ ràng trong `src/bootstrap` thay vì framework-level DI container. Điều này làm object wiring dễ nhìn hơn và giữ runtime framework nhẹ hơn.

### Repository ports với MongoDB và PostgreSQL adapters

Domain và application code phụ thuộc vào repository contracts, không phụ thuộc trực tiếp vào database clients. Persistence driver được chọn bằng `PERSISTENCE_DRIVER`, và composition root sẽ wire MongoDB hoặc PostgreSQL implementations tương ứng.

### Use cases là application entry points

Controllers gọi application use cases thay vì trực tiếp orchestrate repositories. Điều này giữ HTTP concerns bên ngoài business workflow và giúp use cases dễ test hơn.

### Realtime và background jobs là adapters

Socket.IO features và BullMQ workers được xem là delivery mechanisms bao quanh application logic, không phải trung tâm của domain model.

## Trạng thái hiện tại

Đã triển khai:

- Core authentication và user flows
- Role và permission management
- Post/feed/social interaction flows
- Friend/block relationship flows
- Conversation và notification modules
- Media upload và video processing pipeline
- MongoDB và PostgreSQL persistence adapters
- Redis, queue, Swagger và Postman integration
- Unit, architecture và e2e test setup

Các hướng cải thiện tiếp theo:

- Thêm Docker Compose cho MongoDB/PostgreSQL/Redis local
- Thêm CI workflow cho lint, typecheck, tests và build
- Thêm coverage reporting và thresholds
- Mở rộng e2e tests cho posts, relationships, conversations và media
- Document deployment topology và worker scaling strategy

## Trọng tâm kỹ thuật

Dự án này được thiết kế để thể hiện:

- Business logic được tách khỏi HTTP và database frameworks
- Application use cases dễ test với dependencies rõ ràng
- Cấu trúc backend modular cho social networking domain
- Persistence adapters có thể thay đổi giữa MongoDB và PostgreSQL
- Các concern gần production như queues, caching, rate limits, logs, migrations, API docs và realtime events
