# NodeJS Social

[English](README.md) | Tiếng Việt

Backend service cho một social networking application. Dự án tập trung vào user identity, posts, relationships, conversations, notifications, media upload, realtime events và role-based administration.

Repository này là một TypeScript backend API, được xây theo clean/hexagonal architecture để business rules tách khỏi HTTP, database, queue và third-party infrastructure.

## Features

- Email/password authentication với access tokens và refresh-token cookies
- Google OAuth login flow
- OTP email flow và hỗ trợ two-factor authentication
- User profile, password change và admin user management
- Friend requests, friendships, blocking và unblocking
- Posts, feeds, hashtags, likes, bookmarks, search và view tracking
- Conversations, group chat, messages, typing, read state và realtime presence
- Notifications với realtime delivery và cleanup jobs
- Image upload, video upload, video stream status và static video streaming
- Role và permission management cho protected operations
- Thanh toán đơn hàng mẫu 10.000 VND qua VNPay và MoMo sandbox
- Swagger/OpenAPI documentation và Postman collections
- MongoDB và PostgreSQL persistence adapters nằm sau repository ports
- Hỗ trợ cache/rate-limit bằng Redis và background jobs bằng BullMQ

## Tech Stack

| Phạm vi         | Công nghệ                               |
| --------------- | --------------------------------------- |
| Language        | TypeScript, ESM                         |
| Runtime         | Node.js                                 |
| Package manager | pnpm 11                                 |
| HTTP API        | Express 5                               |
| Realtime        | Socket.IO                               |
| Database        | MongoDB, PostgreSQL                     |
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

## Kiến trúc

Codebase theo layered clean/hexagonal architecture với vertical feature modules.

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
- Database-specific code được ẩn sau repository ports, cho phép chọn implementation MongoDB hoặc PostgreSQL bằng configuration.

## Cấu trúc dự án

```txt
src/
  bootstrap/          Application startup, config, manual DI, route/worker wiring
  infrastructure/     Database, Redis, queue, logger và technical adapters
  modules/            Feature modules dùng các lớp domain/application/infrastructure
  presentation/       Express HTTP API và Socket.IO presentation adapters
  main.ts             Process entry point

swagger/              OpenAPI YAML fragments dùng bởi Swagger UI
postman/              Postman collections và environment
scripts/              Utility và seed scripts
.github/workflows/    GitHub Actions deployment workflows
Dockerfile            Production container image definition
test/
  architecture/       Architecture boundary tests
  e2e/                End-to-end HTTP tests
  support/            Builders, doubles và mocks cho test
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
- `operations`: internal admin/maintenance actions như cache clearing và permission sync
- `payment`: thanh toán order; use cases phụ thuộc repository/gateway ports, adapter riêng cho MongoDB, PostgreSQL, VNPay và MoMo
- `core`: shared DDD primitives, base use-case contracts, repository bases và app-wide ports

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

Tạo local environment file từ example:

```bash
cp .env.example .env.development
```

Sau đó điền các biến bắt buộc.

Các biến quan trọng:

| Variable                                                                                      | Mục Đích                                                             |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `PORT`                                                                                        | HTTP server port                                                     |
| `APP_URL`                                                                                     | Backend application URL                                              |
| `FRONTEND_URL`                                                                                | Frontend URL dùng cho CORS defaults                                  |
| `CORS_ORIGINS`                                                                                | Danh sách origins được phép, phân tách bằng dấu phẩy                 |
| `DATABASE_ADAPTER`                                                                            | `mongo` hoặc `postgres`                                              |
| `MONGO_URI`, `MONGO_DB_NAME`                                                                  | MongoDB connection config                                            |
| `POSTGRES_URI`, `POSTGRES_SSL`                                                                | PostgreSQL connection config                                         |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`                                      | Redis connection config                                              |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`                                                 | JWT secrets                                                          |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`                             | Google OAuth config                                                  |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`              | S3 storage config                                                    |
| `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`                                                       | API key Resend và email người gửi cho luồng OTP/email                |
| `VNPAY_TMN_CODE`, `VNPAY_SECURE_SECRET`, `VNPAY_HOST`                                         | Thông tin VNPay sandbox; host phải là `https://sandbox.vnpayment.vn` |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_STORE_ID`, `MOMO_STORE_NAME` | Thông tin MoMo sandbox                                               |
| `PAYMENT_PUBLIC_BASE_URL`                                                                     | HTTPS origin công khai để provider gọi callback; không thêm path     |
| `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`                                | API rate limit config                                                |

Không commit secrets thật trong `.env.*`.

TSX chỉ theo dõi các source file đã được import. Hãy khởi động lại development process sau khi thay đổi file `.env.*` hoặc file trong thư mục `swagger/`.

### Payment sandbox

Payment routes được mount ở mọi app environment. VNPay và MoMo luôn được cấu hình sandbox; kể cả khi ứng dụng chạy bằng `.env.production`, giao dịch vẫn đi tới test provider và không chuyển tiền thật. Không dùng tích hợp này cho giao dịch production.

Điền các biến payment trong `.env.development` bằng sandbox merchant credentials bạn đang dùng trong `nestjs-ecommerce`. Không đưa merchant secrets vào Postman collection hoặc git. `VNPAY_HOST` phải là `https://sandbox.vnpayment.vn`. `PAYMENT_PUBLIC_BASE_URL` phải là HTTPS origin có thể truy cập từ Internet, ví dụ domain HTTPS do tunnel cấp; server local không thể nhận callback từ provider nếu không được expose.

API tạo một order thanh toán sandbox cố định 10.000 VND:

```http
POST /api/v1/payments
Authorization: Bearer <access-token>
Idempotency-Key: <unique-key>
Content-Type: application/json

{"provider":"vnpay"}
```

Đổi `provider` thành `momo` để thử MoMo. Mở `data.checkoutUrl` để thanh toán; dùng `GET /api/v1/payments/{paymentId}` để đọc trạng thái. Trạng thái được xác nhận bởi IPN đã xác thực chữ ký; trang return của provider chỉ hiển thị hướng dẫn kiểm tra trạng thái và không tự kết luận giao dịch thành công.

Trước khi test live sandbox:

1. Khởi động server và migration cho database đã chọn.
2. Mở server qua một HTTPS tunnel. Đặt `PAYMENT_PUBLIC_BASE_URL` bằng origin tunnel, rồi khởi động lại server.
3. Với VNPay, cấu hình IPN URL trong merchant sandbox là `{PAYMENT_PUBLIC_BASE_URL}/api/v1/payments/callbacks/vnpay/ipn`. Return URL được sinh bởi ứng dụng là `{PAYMENT_PUBLIC_BASE_URL}/api/v1/payments/callbacks/vnpay/return`.
4. Với MoMo, IPN và return URLs được gửi trong payment request: `/api/v1/payments/callbacks/momo/ipn` và `/api/v1/payments/callbacks/momo/return`.
5. Đăng nhập để lấy access token, rồi dùng folder **Payment Sandbox** trong Postman hoặc gọi API ở trên. Callback không nên được giả lập bằng request thủ công vì chữ ký phải do provider tạo.

Thông tin thử thanh toán lấy từ hướng dẫn chính thức của provider:

- VNPay: chọn NCB; số thẻ `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456` ([tài liệu sandbox VNPay](https://sandbox.vnpayment.vn/apis/docs/gioi-thieu/)).
- MoMo: cài MoMo Test App theo [hướng dẫn test chính thức](https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions/), tạo Test Wallet bằng số điện thoại hợp lệ; mật khẩu và OTP mặc định `000000`.

Automated tests kiểm tra adapter, chữ ký, persistence, callback và API wiring bằng credentials giả; chúng không gọi provider. Live sandbox smoke test cần merchant sandbox credentials hợp lệ, tunnel HTTPS, mở trang checkout và xác nhận IPN cập nhật trạng thái payment.

### Database Migrations

Chạy migration cho persistence driver bạn đã chọn.

MongoDB:

```bash
pnpm run db:migrate:mongo
```

PostgreSQL:

```bash
pnpm run db:migrate:postgres
```

Các lệnh migration hữu ích:

```bash
pnpm run db:migrations:pending:mongo
pnpm run db:migrations:executed:mongo
pnpm run db:rollback:mongo

pnpm run db:migrations:pending:postgres
pnpm run db:migrations:executed:postgres
pnpm run db:rollback:postgres
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

Repository có production `Dockerfile` dựa trên `node:24-alpine`. Image cài dependencies bằng pnpm, build TypeScript app và start bằng:

```bash
pnpm start:prod
```

Build image:

```bash
docker build -t nodejs-social .
```

Run container với production environment file:

```bash
docker run --rm --env-file .env.production -p 3000:3000 nodejs-social
```

Container chỉ chạy API process. MongoDB/PostgreSQL, Redis, S3/SES hoặc Cloudinary, và các external services khác vẫn cần được cung cấp riêng.

## Scripts

| Lệnh                         | Mô tả                                           |
| ---------------------------- | ----------------------------------------------- |
| `pnpm run dev`               | Start development server với `.env.development` |
| `pnpm run build`             | Compile TypeScript và rewrite path aliases      |
| `pnpm run build:clean`       | Xóa `dist` và build lại                         |
| `pnpm run start:dev`         | Run compiled app với development env            |
| `pnpm run lint`              | Chạy ESLint                                     |
| `pnpm run prettier`          | Kiểm tra formatting                             |
| `pnpm run typecheck`         | Type-check production build config              |
| `pnpm run typecheck:test`    | Type-check test config                          |
| `pnpm run test`              | Chạy toàn bộ configured Vitest tests            |
| `pnpm run test:unit`         | Chạy module/unit tests                          |
| `pnpm run test:architecture` | Chạy architecture boundary tests                |

## CI/CD

Production deployment được configure trong `.github/workflows/deploy-production.yml`.

Workflow chạy khi:

- Push lên `main`
- Chạy thủ công qua `workflow_dispatch`

Luồng deployment:

- Checkout repository
- Kiểm tra production Docker build bằng `docker build --platform linux/amd64 -t nodejs-social:ci .`
- Install Render CLI
- Tạo Render deploy cho configured service và chờ hoàn tất
- Gửi thông báo Telegram khi thành công hoặc thất bại

Các GitHub repository secrets bắt buộc:

| Secret              | Mục đích                      |
| ------------------- | ----------------------------- |
| `RENDER_API_KEY`    | Authenticate Render CLI       |
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

## Chiến lược Testing

Dự án dùng Vitest cho unit, architecture, integration và e2e tests.

Trọng tâm test hiện tại:

- Application use cases trong feature modules, đặc biệt là các luồng authentication và user
- Architecture boundary tests với `tsarch`
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

Architecture tests giúp enforce layer direction như dự kiến, để domain/application code không vô tình depend on presentation hoặc infrastructure details.

## Quyết định thiết kế

### Clean architecture với feature modules

Mỗi vùng nghiệp vụ được tổ chức thành một vertical module. Cách này giữ domain language gần với use cases, đồng thời vẫn tách biệt trách nhiệm domain, application và infrastructure.

### Manual dependency injection

Dự án dùng một container tường minh trong `src/bootstrap` thay vì DI container ở cấp framework. Cách này làm object wiring rõ ràng và giữ runtime framework gọn nhẹ.

### Repository ports với adapter MongoDB và PostgreSQL

Domain và application code phụ thuộc vào repository contracts, không phụ thuộc database clients. Persistence driver được chọn bằng `DATABASE_ADAPTER`, và composition root nối implementation MongoDB hoặc PostgreSQL tương ứng.

### Use cases là điểm vào của application

Controllers gọi application use cases thay vì trực tiếp điều phối repositories. Điều này giữ HTTP concerns nằm ngoài business workflow và giúp use cases dễ test hơn.

### Realtime và background jobs là adapters

Socket.IO features và BullMQ workers được xem là cơ chế delivery bao quanh application logic, không phải trung tâm của domain model.

## Trạng thái hiện tại

Đã triển khai:

- Core authentication và user flows
- Role và permission management
- Các luồng post/feed/social interaction
- Friend/block relationship flows
- Module conversation và notification
- Pipeline upload media và xử lý video
- MongoDB và PostgreSQL persistence adapters
- Tích hợp Redis, queue, Swagger và Postman
- Production image bằng Docker
- GitHub Actions deploy lên Render với bước kiểm tra Docker build và thông báo Telegram
- Thiết lập unit, architecture và e2e tests

Cải tiến tiếp theo nên làm:

- Thêm Docker Compose để khởi động MongoDB/PostgreSQL/Redis local
- Thêm CI quality gates cho lint, typecheck, tests và build
- Thêm coverage reporting và thresholds
- Mở rộng e2e tests cho posts, relationships, conversations và media
- Document deployment topology, runtime environment setup và worker scaling strategy

## Trọng tâm kỹ thuật

Dự án được thiết kế để thể hiện:

- Business logic được tách khỏi HTTP và database frameworks
- Application use cases dễ test với dependencies tường minh
- Cấu trúc backend modular cho domain mạng xã hội
- Adapter persistence có thể thay thế giữa MongoDB và PostgreSQL
- Các concern hướng production như queues, caching, rate limits, logs, migrations, API docs, Docker deployment và realtime events
