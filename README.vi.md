# NodeJS Social

[English](README.md) | Tiếng Việt

Dịch vụ backend cho một ứng dụng mạng xã hội. Dự án tập trung vào định danh người dùng, bài viết, quan hệ bạn bè, hội thoại, thông báo, tải lên media, sự kiện realtime và quản trị theo vai trò.

Repository này được xây dựng như một API backend TypeScript, theo phong cách kiến trúc clean/hexagonal để tách biệt quy tắc nghiệp vụ khỏi HTTP, cơ sở dữ liệu, hàng đợi và các tích hợp hạ tầng bên thứ ba.

## Tính năng

- Xác thực bằng email/mật khẩu với access token và refresh-token cookie
- Luồng đăng nhập Google OAuth
- Luồng OTP qua email và hỗ trợ xác thực hai yếu tố
- Hồ sơ người dùng, đổi mật khẩu và quản lý người dùng bởi admin
- Yêu cầu kết bạn, quan hệ bạn bè, chặn và bỏ chặn
- Bài viết, feed, hashtag, lượt thích, bookmark, tìm kiếm và theo dõi lượt xem
- Hội thoại, chat nhóm, tin nhắn, trạng thái đang nhập, trạng thái đã đọc và hiện diện realtime
- Thông báo với phân phối realtime và các job dọn dẹp
- Tải lên ảnh, tải lên video, trạng thái video stream và phát video tĩnh
- Quản lý vai trò và quyền cho các thao tác được bảo vệ
- Tài liệu Swagger/OpenAPI và Postman collections
- Adapter lưu trữ MongoDB và PostgreSQL nằm sau repository ports
- Hỗ trợ cache/rate-limit bằng Redis và background jobs bằng BullMQ

## Tech Stack

| Phạm vi          | Công nghệ                               |
| ---------------- | --------------------------------------- |
| Ngôn ngữ         | TypeScript, ESM                         |
| Runtime          | Node.js                                 |
| Package manager  | pnpm 11                                 |
| HTTP API         | Express 5                               |
| Realtime         | Socket.IO                               |
| Cơ sở dữ liệu    | MongoDB, PostgreSQL                     |
| Cache / hàng đợi | Redis, BullMQ                           |
| Auth             | JWT, bcrypt, Google OAuth, OTPAuth      |
| Storage / email  | AWS S3, AWS SES                         |
| Media            | Sharp, ffmpeg-compatible video pipeline |
| Validation       | Valibot, express-validator-style pipes  |
| Logging          | Pino                                    |
| API docs         | Swagger UI, OpenAPI YAML                |
| Testing          | Vitest, Supertest, tsarch               |
| Container        | Docker                                  |
| Deployment       | GitHub Actions, Render                  |

## Kiến trúc

Codebase đi theo phong cách clean/hexagonal phân lớp, kết hợp các feature module theo chiều dọc.

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

Ý tưởng chính:

- `src/modules/<feature>/domain` chứa business entities, value objects và repository contracts.
- `src/modules/<feature>/application` chứa use cases, application services và outbound ports.
- `src/modules/<feature>/infrastructure` chứa các adapter cho persistence, queue và service.
- `src/presentation` chứa adapter Express và Socket.IO.
- `src/bootstrap` là composition root dùng để nối repositories, services, routes, workers và socket features.
- Code riêng cho từng cơ sở dữ liệu được ẩn sau repository ports, cho phép chọn implementation MongoDB hoặc PostgreSQL thông qua cấu hình.

## Cấu trúc dự án

```txt
src/
  bootstrap/          Khởi động ứng dụng, cấu hình, DI thủ công, nối route/worker
  infrastructure/     Database, Redis, queue, logger và adapter kỹ thuật dùng chung
  modules/            Feature modules dùng các lớp domain/application/infrastructure
  presentation/       Express HTTP API và Socket.IO presentation adapters
  index.ts            Điểm vào của process

swagger/              Các mảnh OpenAPI YAML dùng bởi Swagger UI
postman/              Postman collections và environment
scripts/              Script tiện ích và seed
.github/workflows/    GitHub Actions workflows cho deployment
Dockerfile            Định nghĩa production container image
test/
  architecture/       Kiểm thử ranh giới kiến trúc
  e2e/                Kiểm thử HTTP end-to-end
  support/            Builders, doubles và mocks cho test
```

Các module chính:

- `authentication`: đăng ký, đăng nhập, refresh token, đăng xuất, OTP, 2FA, Google OAuth
- `authorization`: vai trò và quyền
- `user`: hồ sơ người dùng và thao tác admin với người dùng
- `relationship`: bạn bè, yêu cầu kết bạn và chặn
- `post`: bài viết, feed, hashtag, lượt thích, bookmark và lượt xem
- `conversation`: hội thoại, thành viên, tin nhắn và thao tác nhóm
- `notification`: danh sách thông báo, trạng thái đã đọc, hiện diện realtime và dọn dẹp
- `media`: tải lên ảnh, tải lên video, trạng thái stream và phát video tĩnh
- `operations`: hành động admin/bảo trì nội bộ như xóa cache và đồng bộ quyền
- `core`: DDD primitives dùng chung, hợp đồng base use-case, repository bases và ports toàn ứng dụng

## Bắt đầu

### Yêu cầu

- Node.js. Dự án hiện được phát triển với Node `v25.3.0`.
- pnpm `11.0.0`
- MongoDB hoặc PostgreSQL
- Redis
- ffmpeg có trong `PATH` nếu muốn chạy các luồng xử lý video
- AWS S3/SES credentials cho các luồng media và email gần giống production

### Cài đặt

```bash
pnpm install
```

### Môi trường

Tạo file môi trường local từ file ví dụ:

```bash
cp .env.example .env.development
```

Sau đó điền các biến bắt buộc.

Các biến quan trọng:

| Biến                                                                             | Mục đích                                             |
| -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `PORT`                                                                           | Cổng HTTP server                                     |
| `APP_URL`                                                                        | URL ứng dụng backend                                 |
| `FRONTEND_URL`                                                                   | URL frontend dùng cho CORS mặc định                  |
| `CORS_ORIGINS`                                                                   | Danh sách origins được phép, phân tách bằng dấu phẩy |
| `DATABASE_ADAPTER`                                                               | `mongo` hoặc `postgres`                              |
| `MONGO_URI`, `MONGO_DB_NAME`                                                     | Cấu hình kết nối MongoDB                             |
| `POSTGRES_URI`, `POSTGRES_SSL`                                                   | Cấu hình kết nối PostgreSQL                          |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`                         | Cấu hình kết nối Redis                               |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`                                    | JWT secrets                                          |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`                | Cấu hình Google OAuth                                |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` | Cấu hình lưu trữ S3                                  |
| `SES_FROM_ADDRESS`                                                               | Email người gửi cho luồng OTP/email                  |
| `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`                   | Cấu hình API rate limit                              |

Không commit secrets thật trong `.env.*`.

### Database Migrations

Chạy migration cho persistence driver bạn đã chọn.

MongoDB:

```bash
pnpm run db:migrate:mongo --env=development
```

PostgreSQL:

```bash
pnpm run db:migrate:postgres --env=development
```

Các lệnh migration hữu ích:

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

### Chạy development server

```bash
pnpm run dev
```

Các môi trường khác:

```bash
pnpm run dev:staging
pnpm run dev:prod
```

API prefix là:

```txt
/api/v1
```

Swagger UI có tại:

```txt
/api/docs
```

### Build và chạy bằng Docker

Repository có production `Dockerfile` dựa trên `node:22-alpine`. Image cài dependencies bằng pnpm, build TypeScript app và khởi động bằng:

```bash
pnpm start:prod
```

Build image:

```bash
docker build -t nodejs-social .
```

Chạy container với file môi trường production:

```bash
docker run --rm --env-file .env.production -p 3000:3000 nodejs-social
```

Container chỉ chạy API process. MongoDB/PostgreSQL, Redis, S3/SES hoặc Cloudinary, và các dịch vụ bên ngoài khác vẫn cần được cung cấp riêng.

## Scripts

| Lệnh                         | Mô tả                                               |
| ---------------------------- | --------------------------------------------------- |
| `pnpm run dev`               | Khởi động development server với `.env.development` |
| `pnpm run build`             | Biên dịch TypeScript và viết lại path aliases       |
| `pnpm run build:clean`       | Xóa `dist` và build lại                             |
| `pnpm run start:dev`         | Chạy app đã biên dịch với development env           |
| `pnpm run lint`              | Chạy ESLint                                         |
| `pnpm run prettier`          | Kiểm tra formatting                                 |
| `pnpm run typecheck`         | Type-check cấu hình production build                |
| `pnpm run typecheck:test`    | Type-check cấu hình test                            |
| `pnpm run test`              | Chạy toàn bộ Vitest tests đã cấu hình               |
| `pnpm run test:unit`         | Chạy module/unit tests                              |
| `pnpm run test:architecture` | Chạy kiểm thử ranh giới kiến trúc                   |

## CI/CD

Production deployment được cấu hình trong `.github/workflows/deploy-production.yml`.

Workflow chạy khi:

- Push lên `main`
- Chạy thủ công qua `workflow_dispatch`

Luồng deployment:

- Checkout repository
- Kiểm tra production Docker build bằng `docker build --platform linux/amd64 -t nodejs-social:ci .`
- Cài Render CLI
- Tạo deploy trên Render cho service đã cấu hình và chờ hoàn tất
- Gửi thông báo Telegram khi thành công hoặc thất bại

Các GitHub repository secrets bắt buộc:

| Secret              | Mục đích                      |
| ------------------- | ----------------------------- |
| `RENDER_API_KEY`    | Xác thực Render CLI           |
| `RENDER_SERVICE_ID` | Render service đích           |
| `TELEGRAM_TO`       | Telegram chat/user identifier |
| `TELEGRAM_TOKEN`    | Telegram bot token            |

Các biến môi trường runtime của ứng dụng nên được cấu hình trong Render hoặc môi trường deploy đích, không commit vào repository.

## Tổng quan API

Routes được mount dưới `/api/v1`.

| Phạm vi             | Base path                            |
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

Tài liệu và collections hữu ích:

- Swagger UI: `/api/docs`
- Postman collection: [postman/COLLECTION_API.postman.json](./postman/COLLECTION_API.postman.json)
- Postman environment: [postman/ENV.postman.json](./postman/ENV.postman.json)

## Chiến lược kiểm thử

Dự án dùng Vitest cho unit, architecture, integration và e2e tests.

Trọng tâm test hiện tại:

- Application use cases trong feature modules, đặc biệt là các luồng authentication và user
- Kiểm thử ranh giới kiến trúc với `tsarch`
- Luồng e2e authentication-user qua HTTP layer
- Test support helpers, builders, doubles và mocks trong `test/support`

Chạy tests:

```bash
pnpm run test
```

Chỉ chạy architecture tests:

```bash
pnpm run test:architecture
```

Architecture tests giúp đảm bảo chiều phụ thuộc giữa các layer như dự kiến, để domain/application code không vô tình phụ thuộc vào chi tiết presentation hoặc infrastructure.

## Quyết định thiết kế

### Clean architecture với feature modules

Mỗi vùng nghiệp vụ được tổ chức thành một module theo chiều dọc. Cách này giữ ngôn ngữ domain gần với use cases, đồng thời vẫn tách biệt trách nhiệm domain, application và infrastructure.

### Dependency injection thủ công

Dự án dùng một container tường minh trong `src/bootstrap` thay vì DI container ở cấp framework. Cách này làm wiring object rõ ràng và giữ runtime framework gọn nhẹ.

### Repository ports với adapter MongoDB và PostgreSQL

Domain và application code phụ thuộc vào repository contracts, không phụ thuộc database clients. Persistence driver được chọn bằng `DATABASE_ADAPTER`, và composition root nối implementation MongoDB hoặc PostgreSQL tương ứng.

### Use cases là điểm vào của application

Controllers gọi application use cases thay vì trực tiếp điều phối repositories. Điều này giữ HTTP concerns nằm ngoài business workflow và giúp use cases dễ test hơn.

### Realtime và background jobs là adapters

Socket.IO features và BullMQ workers được xem là cơ chế delivery bao quanh application logic, không phải trung tâm của domain model.

## Trạng thái hiện tại

Đã triển khai:

- Các luồng authentication và user cốt lõi
- Quản lý vai trò và quyền
- Các luồng post/feed/social interaction
- Các luồng quan hệ friend/block
- Module conversation và notification
- Pipeline upload media và xử lý video
- Adapter persistence MongoDB và PostgreSQL
- Tích hợp Redis, queue, Swagger và Postman
- Production image bằng Docker
- GitHub Actions deploy lên Render với bước kiểm tra Docker build và thông báo Telegram
- Thiết lập unit, architecture và e2e tests

Cải tiến tiếp theo nên làm:

- Thêm Docker Compose để khởi động MongoDB/PostgreSQL/Redis local
- Thêm CI quality gates cho lint, typecheck, tests và build
- Thêm báo cáo coverage và thresholds
- Mở rộng e2e tests cho posts, relationships, conversations và media
- Tài liệu hóa deployment topology, cấu hình runtime environment và chiến lược scale workers

## Trọng tâm kỹ thuật

Dự án được thiết kế để thể hiện:

- Business logic được tách khỏi HTTP và database frameworks
- Application use cases dễ test với dependencies tường minh
- Cấu trúc backend modular cho domain mạng xã hội
- Adapter persistence có thể thay thế giữa MongoDB và PostgreSQL
- Các concern hướng production như queues, caching, rate limits, logs, migrations, API docs, Docker deployment và realtime events
