# Phase 7: Quality hardening & tests — Research

**Researched:** 2026-03-23  
**Domain:** Vitest integration testing (HTTP + Socket.IO), env/bootstrap constraints, CONCERNS reconciliation  
**Confidence:** HIGH (stack versions from `npm view` + repo files); MEDIUM (singleton/bootstrap flakiness and `envConfig` argv coupling—needs executor validation)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 1. Smoke integration (QUAL-02)

- **D-01:** Suite smoke **gồm cả hai** nhánh: **(a)** auth tối thiểu (đăng ký/đăng nhập hoặc seed user + lấy JWT — do planner cụ thể hóa) **và** ít nhất một **API có Bearer**; **(b)** **friend**: luồng tối thiểu có ý nghĩa (vd. gửi request + accept, hoặc tương đương đủ để chứng minh graph + guard); **(c)** **chat HTTP**: tối thiểu **text-only** (tạo/tìm direct conv giữa hai user đã bạn + gửi tin + đọc list/cursor tùy contract) — **không** bắt buộc attachment S3 trong smoke đầu.
- **D-02:** Smoke **không** nhằm coverage đầy đủ; chỉ bảo vệ regressions trên đường đi đã chọn và đáp ứng văn bản QUAL-02 + roadmap.

#### 2. Socket trong automated tests

- **D-03:** Phase 7 **có** ít nhất **một** test tự động Socket.IO **tối thiểu:** client kết nối với **JWT hợp lệ**, **join** room conversation **`chat:<conversationId>`** (hoặc constant tương đương trong code) khi user là **thành viên** — align SOCK-01/02.
- **D-04:** **Không** bắt buộc trong smoke đầu: assert mọi loại event realtime; **assert một event** sau khi HTTP persist (vd. `chat:message:new`) là **stretch tốt** nếu ổn định — do planner/executor quyết định sau probe flakiness.

#### 3. Bằng chứng đóng CONCERNS (QUAL-01)

- **D-05:** Bắt buộc **hai lớp tài liệu:** **(1)** `.planning/phases/07-quality-hardening-tests/07-VERIFICATION.md` — checklist verify + tham chiếu test/commit; **(2)** cập nhật `.planning/codebase/CONCERNS.md` — ghi rõ mục nào **resolved / verified closed** trên path triển khai, ngày/phase, link tới verification hoặc test path (không xóa lịch sử; ưu tiên section “Resolved” hoặc status table).

#### 4. Cổng chất lượng (local vs CI)

- **D-06:** **Definition of done** phase 7: **`npm test` (hoặc script tương đương)** chạy **thành công trên máy dev** với **hướng dẫn env** trong plan/README test (Mongo + Redis theo pattern dự án — planner chi tiết).
- **D-07:** **CI (GitHub Actions hoặc tương đương) không nằm trong DoD phase 7**; có thể ghi **Deferred** nếu muốn làm ngay sau — tránh bloated phase 7.

### Claude's Discretion

- Cụ thể framework (Vitest + `@vitest/coverage` có hay không), supertest vs fetch, factory/seed script, timeout, parallel vs serial cho socket, tách `test` MongoDB name — miễn thỏa D-01…D-07 và không phá QUAL-01 scope.

### Deferred Ideas (OUT OF SCOPE)

- **CI bắt buộc xanh** trên mọi PR — ngoài DoD phase 7 (D-07); có thể thêm phase nhỏ hoặc backlog.
- Mở rộng CONCERNS P2 (S3 memory, `any`, feed counters) — không thuộc QUAL-01 theo roadmap; phase riêng hoặc backlog.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **QUAL-01** | Sửa/verify các lỗ hổng trong `CONCERNS.md` liên quan **socket identity** và **persist/emit** trên đường chat đã ship | Reconcile matrix vs `src/services/socket.service.ts` + chat HTTP (`src/routes/chats.route.ts`); document in `07-VERIFICATION.md`; update `CONCERNS.md` Resolved section |
| **QUAL-02** | Test runner + smoke auth + friend + chat HTTP (per CONTEXT, strict hơn một-dòng REQUIREMENTS) | Vitest + supertest + real Mongo/Redis; smoke qua `/api/*`; verified-user path qua `verify-email` + DB token read hoặc seed |
</phase_requirements>

## Summary

Phase 7 adds **Vitest** as the test runner (already assumed in prior planning) and **integration-level smoke** that hits the real stack: MongoDB (social + chat DBs), Redis (rate limit store, caches, queues), Express 5, and Socket.IO. The public surface for smoke is **`/api`** (`src/config/generalConfig.ts` → `prefix: '/api'`) with routers mounted in `src/app.ts` (`/auth`, `/friends`, `/chats`, …).

**Bootstrap friction:** `src/config/envConfig.ts` loads dotenv from **`.env.${envMode}`** when `process.argv` contains `--env=<mode>` (via `minimist`); otherwise it loads **`.env`**. It also **requires every key** in `ENV_KEYS` to be non-empty. Tests that import `createApp` from `src/app.ts` pull in `envConfig` at module load time, so the test command and env files must be planned explicitly (see Common Pitfalls).

**CONCERNS.md (2026-03-21)** predates Phase 4 removal of experimental conversations and Phase 6 chat/socket rework. Several rows reference **`src/routes/conversations.route.ts`** and socket **`sendMessage`** with client `senderId` — those files/behaviors are **not present** in the current tree (`src/routes/conversations*` absent). QUAL-01 should **verify current behavior** and mark historical rows **obsolete vs superseded** rather than blindly “fixing” dead paths.

**Primary recommendation:** Add **`vitest`**, **`supertest`**, **`@types/supertest`**, optionally **`@vitest/coverage-v8`**; add **`vitest.config.ts`** with `resolve.alias` matching `tsconfig.json` `@/*` → `./src/*`; implement **`tests/integration/smoke.*`** using **`createServer` + `createApp`** from `src/app.ts`, ephemeral port, **dedicated `DATABASE_NAME` / `DATABASE_CHAT_NAME`** for test; one **`tests/integration/socket-subscribe.*`** using **`socket.io-client`** (already `devDependency` in `package.json`) with `auth: { Authorization: 'Bearer <access>' }` matching `SocketService` handshake; document env in **`README`** or **`.planning/...` test section**; produce **`07-VERIFICATION.md`** and edit **`CONCERNS.md`**.

## Standard Stack

### Core

| Library | Version (verified 2026-03-23) | Purpose | Why Standard |
|---------|-------------------------------|---------|--------------|
| `vitest` | **4.1.0** (`npm view vitest version`) | Test runner, ESM-native, Vite resolution | CONTEXT lock-in; official Socket.IO doc lists Vitest |
| `supertest` | **7.2.2** | HTTP assertions against Express | De-facto standard for Node HTTP integration tests |
| `socket.io-client` | **^4.8.3** (already in `package.json` `devDependencies`) | Connect to `SocketService` in-process test server | Same major as server `socket.io` ^4.8.3 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/supertest` | **7.2.0** | Typings for supertest | TypeScript strictness |
| `@vitest/coverage-v8` | **4.1.0** | Coverage | Optional (Claude’s discretion); enable if gate desired |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `supertest` | Native `fetch` against `http://127.0.0.1:<port>` | More boilerplate, no `expect(res).toHaveProperty` ergonomics |
| Vitest | Jest + `ts-jest` | Extra config for ESM + path aliases; Vitest aligns with Vite ecosystem |

**Installation:**

```bash
npm install -D vitest supertest @types/supertest
# optional:
npm install -D @vitest/coverage-v8
```

**Version verification:** Ran `npm view vitest version`, `npm view @vitest/coverage-v8 version`, `npm view supertest version`, `npm view @types/supertest version` on 2026-03-23.

## Stack fit: Vitest + supertest (and when to skip supertest)

- **Vitest:** Use `defineConfig` from `vitest/config` (no Vite app required). Set `resolve.alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }` (or `path.resolve`) so tests can import `createApp` from `src/app.ts` with `@/` paths ([Vitest config](https://vitest.dev/config/) — resolve.alias on top-level).
- **supertest:** After `await createApp(httpServer, appConfig)`, call `httpServer.listen(0)` and use `supertest(httpServer)` **or** pass the Express app if only HTTP routes matter. This repo attaches the Express app via `httpServer.on('request', app)` (`src/app.ts`), so **binding supertest to the `http.Server` instance** is the correct integration surface (Socket.IO shares that server).
- **Alternative:** If supertest misbehaves with Express 5 + listener wiring, use `fetch(\`http://127.0.0.1:${port}/api/...\`)` after `listen` — still valid; supertest is preferred for readability.

## Test DB / env isolation

- **MongoDB:** Use the same `DATABASE_URI` as dev **but** override **`DATABASE_NAME`** and **`DATABASE_CHAT_NAME`** to dedicated values (e.g. `nodejs_social_test`, `nodejs_social_chat_test`) via a **test-only** env file or shell exports documented in README. Avoid wiping production/dev DBs in `beforeAll`.
- **Redis:** Use **`REDIS_DB`** index different from dev (e.g. `15`) or a dedicated Redis instance URL if available — reduces collision with dev rate-limit keys and BullMQ state (`QueueService.init` in `createApp`).
- **S3 / SES / OAuth:** Keys are still **required** by `envConfig` even if smoke never calls those code paths. Use dummy values consistent with existing `.env.example` patterns, or plan a **narrow test env file** that satisfies all `ENV_KEYS`.
- **Data hygiene:** Between runs, optional `beforeAll`/`afterAll` collection drops in test DBs, or delete only documents created with test prefixes — planner chooses; document tradeoff (speed vs isolation).

## How to boot the app in tests

1. **Import order / env:** Ensure `process.env` is populated **before** any import of `@/config` (transitively `src/app.ts`). Prefer a **Vitest `setupFile`** that only sets env if you can guarantee it runs before workspace module graph loads — in practice, **spawn subprocess** or **npm script** that loads `.env` first is safer (see pitfalls).
2. **HTTP server:** `import { createServer } from 'node:http'` → `const httpServer = createServer()` → `await createApp(httpServer, appConfig)` mirroring `src/index.ts` (pass `database`, `redis`, `cors`, `rateLimitOptions`). **Do not** call `bootstrap()` from `src/index.ts` in tests if it hard-codes listen port or duplicates side effects.
3. **Listen:** `await new Promise<void>((r) => httpServer.listen(0, '127.0.0.1', r))`, read port via `httpServer.address().port`.
4. **Teardown:** `httpServer.close()`, `await DatabaseInstance.get().close()`, `RedisInstance.get().disconnect()`, `QueueService.close()` — mirror `setupGracefulShutdown` in `src/app.ts` or accept OS cleanup on process exit; **serial socket tests** may need explicit close to avoid open-handle warnings.
5. **Singletons:** `DatabaseInstance`, `RedisInstance`, `Container`, `QueueService` are process-wide. **Prefer `poolOptions: { maxWorkers: 1 }` or `fileParallelism: false`** for integration files that boot the full app, unless you invest in reset APIs.

## Smoke flow outline (auth, friends, chat HTTP)

All protected chat/friends routes use **`userVerifiedValidation`** (`src/routes/chats.route.ts`, `src/routes/friends.route.ts`). New users are **`UNVERIFIED`** after `POST /api/auth/register` (`src/services/auth.service.ts`). **`RegisterResponseDTO`** does **not** expose `emailVerificationToken` (`src/dtos/responses/user.response.dto.ts`), so smoke must either:

- **A (recommended):** After register, read **`emailVerificationToken`** from the users collection via **MongoDB** in a test helper (same `DATABASE_URI` + test `DATABASE_NAME`), then `POST /api/auth/verify-email` with **`protect`** + body `{ token }` (`src/controllers/auth.controller.ts`), **or**
- **B:** Seed verified users through a one-off script/fixture that inserts `verificationStatus: VERIFIED`.

**Minimal sequence (two users A, B):**

1. **Auth:** `POST /api/auth/register` ×2 → `POST /api/auth/login` ×2 (login works before verify — `auth.service.ts` does not block unverified on login) → verify each user via `/api/auth/verify-email` as above → retain **Bearer accessToken**.
2. **Bearer check:** Any `protect` route proves D-01(b); e.g. `GET /api/users/me` if available, or first friends call below.
3. **Friend:** A: `POST /api/friends/requests` with B’s user id → B: `POST /api/friends/requests/:fromUserId/accept` (`src/routes/friends.route.ts`).
4. **Chat HTTP (text-only):** A: `POST /api/chats/direct` with B’s peer id (`src/routes/chats.route.ts`) → `POST /api/chats/:chatId/messages` with text body per `sendMessageBody` validation → `GET /api/chats/:chatId/messages` (cursor optional per contract).

## Socket.IO test approach (D-03)

**Server behavior (current code):**

- Handshake: `socket.handshake.auth.Authorization` → Bearer JWT (`src/services/socket.service.ts` `initMiddleware`).
- Subscribe: client emits **`chat:subscribe`** (`SOCKET_CLIENT_CHAT_SUBSCRIBE` in `src/constants/socket.constant.ts`) with `{ conversationId: '<hex>' }`. Server checks membership via `chatMemberRepository.findMembership`, then **`socket.join(chatRoom(raw))`** where `chatRoom` = **`chat:` + conversationId**.

**Client setup:**

```typescript
import { io as ioc } from 'socket.io-client';
// url: http://127.0.0.1:<port>
const socket = ioc(url, {
  auth: { Authorization: `Bearer ${accessToken}` },
  // If CORS rejects: add transports / extraHeaders per Socket.IO client docs
});
await new Promise((res, rej) => {
  socket.once('connect', res);
  socket.once('connect_error', rej);
});
socket.emit('chat:subscribe', { conversationId: chatIdHex });
// Assert: socket connected; optionally verify server-side room membership via follow-up event (D-04 stretch: listen for chat:message:new after HTTP send)
```

**Risks / flakiness:** CORS on `Server` in `SocketService` uses **`envConfig.FRONTEND_URL`** (`src/services/socket.service.ts`). Node `socket.io-client` may send an `Origin` that must be allowed — validate in probe; set **`FRONTEND_URL=http://127.0.0.1:<port>`** or align with client origin. Typing/presence events are async; use bounded `waitFor` with timeout.

**Official pattern reference:** [Socket.IO v4 testing](https://socket.io/docs/v4/testing/) (Vitest listed; ephemeral `listen(0)` + `socket.io-client`).

## CONCERNS.md reconciliation (obsolete vs needs verification)

| CONCERNS row / section | Current repo reality (2026-03-23) | Action for QUAL-01 / `07-VERIFICATION.md` |
|------------------------|-----------------------------------|-------------------------------------------|
| P0 missing test suite | Still true until Phase 7 lands | Close when `npm test` + files exist; reference test paths |
| P1 socket bypasses persistence; evidence lists `conversations.route.ts` | **`src/routes/conversations.route.ts` không tồn tại**; chat là `/api/chats` (Phase 4). Socket service **không** có `sendMessage` lưu DB — messaging đi HTTP + emitter (`IRealtimeChatEmitter`) | Mark matrix evidence **obsolete**; replace with **current** files: `src/services/socket.service.ts`, `src/routes/chats.route.ts`, `src/controllers/chatMessages.controller.ts`, services/repos chat DB |
| Tech debt: socket `sendMessage` TODO | **Không còn handler tương ứng** trong `socket.service.ts` | Đánh dấu **superseded** bởi HTTP-first + Phase 6 emitters; verify persist-then-emit trên **HTTP path** (không phải socket send) |
| Known bug: client `senderId` in socket payload | **Không thấy** path nhận `senderId` từ client cho chat message trong `socket.service.ts` hiện tại | **Verify closed** nếu audit grep xác nhận; ghi test/grep vào `07-VERIFICATION.md` |
| Socket auth: derive identity from JWT | **Đã align:** `userId` từ `socket.handshake.auth.decoded` cho subscribe/typing (`src/services/socket.service.ts`) | **Verified** với test D-03 + code reference |
| P1 boot single-point failure | Vẫn đúng | **Out of narrow QUAL-01** (CONTEXT: socket + persist/emit path); có thể ghi “unchanged / deferred” trong CONCERNS |
| P2/P3 (S3, `any`, counters) | CONTEXT deferred | **Không** mở trong phase 7 |

**Deliverable:** Add **Resolved / Verified** subsection hoặc status column trong `CONCERNS.md` trỏ tới `07-VERIFICATION.md` và test files — **không xóa** lịch sử audit 2026-03-21.

## Common Pitfalls

### Pitfall 1: `envConfig` argv và dotenv path

**What goes wrong:** Chạy `vitest` không có `--env=development` (hoặc mode khác) → `envMode` undefined → load `.env`; nếu thiếu file hoặc thiếu biến → throw trước khi chạy test. Message lỗi có thể hiển thị `undefined` trong template (`src/config/envConfig.ts`).

**How to avoid:** Document **`npm test`** dạng `vitest run --config vitest.config.ts` **kèm** tiền tố argv: ví dụ wrapper Node đặt `process.argv.push('--env','development')` **trước** import bất kỳ module nào dùng `@/config`, **hoặc** bảo đảm file **`.env`** đầy đủ cho CI local, **hoặc** phase nhỏ refactor test-only bootstrap (ngoài research — flag cho planner nếu cần).

### Pitfall 2: Singletons + parallel workers

**What goes wrong:** Hai worker Vitest cùng `DatabaseInstance.init` / cùng Redis DB → race, flake, hoặc crash.

**How to avoid:** `poolOptions: { maxWorkers: 1 }` hoặc `fileParallelism: false` cho integration suite; tách `tests/unit` (sau này) có thể parallel.

### Pitfall 3: Rate limiting + smoke

**What goes wrong:** `express-rate-limit` + Redis store (`src/app.ts`) chặn smoke khi chạy nhiều request nhanh.

**How to avoid:** Tăng `RATE_LIMIT_MAX` trong test env, hoặc `windowMs` lớn, hoặc tắt `RATE_LIMIT_ENABLED=false` nếu `generalConfig` tôn trọng flag.

### Pitfall 4: Unverified users on friends/chat

**What goes wrong:** Mọi smoke friends/chat trả 403 pipeline validation.

**How to avoid:** Luôn qua **`verify-email`** hoặc seed verified (smoke outline).

### Pitfall 5: Socket CORS / FRONTEND_URL

**What goes wrong:** `connect_error` trên client test do CORS mismatch.

**How to avoid:** Align `FRONTEND_URL` với origin client hoặc điều chỉnh test-only Server config nếu planner chấp nhận nhỏ (đánh giá impact GitNexus trước khi sửa production code).

## Risks / flakiness (summary)

| Risk | Mitigation |
|------|------------|
| Full app boot slow / timeouts | `testTimeout` 30_000–60_000; `hookTimeout` tương tự |
| Redis/Mongo not running | README “prerequisites”; optional skip với `describe.skipIf` khi `process.env.CI_INTEGRATION` absent — **không** khuyến nghị nếu D-06 yêu cầu `npm test` luôn xanh trên máy có stack |
| Email queue side effects on register | Chấp nhận job enqueue hoặc mock `emailJobQueue` ở container — **chỉ** nếu executor chứng minh không làm flake Redis/Bull |
| Stretch D-04: assert `chat:message:new` | Timing: HTTP response trước event; dùng `Promise.race` + timeout; chạy serial |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP integration | Raw TCP | `supertest` | Status/header/body matchers, cookie support |
| Test runner + ESM + TS paths | Custom loader | Vitest + `resolve.alias` | Maintained, Socket.IO docs reference Vitest |
| Socket client | Raw WS | `socket.io-client` | Engine.IO handshake + auth payload |

**Key insight:** Giữ **một** cách boot app (`createApp`) và **một** bộ env test để tránh drift với `src/index.ts`.

## Code Examples

### Vitest config skeleton (alias + serial integration)

```typescript
// vitest.config.ts — pattern from https://vitest.dev/config/
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    poolOptions: { forks: { singleFork: true } },
    setupFiles: ['./tests/setup/env.ts']
  }
});
```

### Ephemeral server + supertest-style target

```typescript
import { createServer } from 'node:http';
import { createApp } from '@/app';
// build appConfig like src/index.ts (from config/envConfig)
```

### Socket.IO minimal client (align `SocketService`)

```typescript
// Source: https://socket.io/docs/v4/testing/ + src/services/socket.service.ts handshake
import { io as ioc } from 'socket.io-client';

const socket = ioc(`http://127.0.0.1:${port}`, {
  auth: { Authorization: `Bearer ${accessToken}` }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Experimental `/api/conversations` + socket-centric messaging | `/api/chats` + chat DB + Phase 6 realtime emitters | Phases 4–6 | CONCERNS evidence paths partly stale |
| No ESM-first test runner in repo | Vitest 4.x standard for Vite/ESM projects | 2024–2025 ecosystem | Aligns with `package.json` `"type": "module"` |

**Deprecated/outdated:** Citing `conversations.route.ts` as active evidence for socket persistence — **remove from “current risk”** after verification grep.

## Open Questions

1. **Có nên thêm `test` export factory không gắn `process.on('SIG*')` để tránh double handlers khi chạy nhiều suite?**
   - What we know: `createApp` registers shutdown on signals (`src/app.ts`).
   - What’s unclear: Vitest watch mode có trigger không.
   - Recommendation: Executor probe; nếu flake, tách `createApp` vs `registerShutdown` trong plan nhỏ.

2. **Email/Bull queue trong register có cần mock không?**
   - What we know: `auth.service.ts` enqueue email job on register.
   - Recommendation: Nếu worker chạy ngoài test process gây noise, mock `IEmailJobQueue` trong test container hoặc dùng Redis DB tách.

## Validation Architecture

> Nyquist enabled (`workflow.nyquist_validation` true in `.planning/config.json`). Dùng section này để derive `07-VALIDATION.md`.

### Test framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (to be added) |
| Config file | `vitest.config.ts` (to be added at repo root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` (single suite giai đoạn đầu) |

### Phase requirements → test map

| Req ID | Behavior | Test type | Automated command | File target (proposed) |
|--------|----------|-----------|-------------------|-------------------------|
| QUAL-02 | Register/login + Bearer API | Integration | `npm test -- tests/integration/smoke.auth.test.ts` | `tests/integration/smoke.auth.test.ts` |
| QUAL-02 | Friend request + accept (verified users) | Integration | `npm test -- tests/integration/smoke.friends.test.ts` | Có thể gộp một file `smoke.social.test.ts` |
| QUAL-02 | Direct chat create + text message + list | Integration | `npm test -- tests/integration/smoke.chat-http.test.ts` | `tests/integration/smoke.chat-http.test.ts` |
| QUAL-02 / D-03 | JWT socket connect + `chat:subscribe` membership | Integration | `npm test -- tests/integration/socket.chat-subscribe.test.ts` | `tests/integration/socket.chat-subscribe.test.ts` |
| QUAL-01 | CONCERNS items verified + doc traceability | Documentation gate | Manual review + checklist trong `07-VERIFICATION.md` | `07-VERIFICATION.md` |
| QUAL-01 | CONCERNS.md updated | Documentation gate | Diff review | `.planning/codebase/CONCERNS.md` |

### Dimensions (for Nyquist)

1. **Auth:** Register, login, verify-email path, JWT on protected route.
2. **HTTP APIs:** Friends graph + chat REST contract (`/api/friends/*`, `/api/chats/*`).
3. **Socket join:** Handshake JWT, `chat:subscribe`, room name `chat:<id>` (`src/constants/socket.constant.ts` `chatRoom()`).
4. **Documentation gates:** `07-VERIFICATION.md` complete; `CONCERNS.md` resolved entries; README/env instructions for `npm test`.

### Sampling rate

- **Per task commit:** `npm test` (scoped file nếu cần).
- **Phase gate:** Full `npm test` green locally (D-06); CI deferred (D-07).

### Wave 0 gaps

- [ ] `vitest.config.ts` + `npm` script `test`
- [ ] `tests/setup/env.ts` (hoặc tương đương) + documented `.env` / argv strategy
- [ ] `tests/integration/*` smoke + socket tối thiểu
- [ ] `07-VERIFICATION.md` template filled during execution
- [ ] `CONCERNS.md` resolved section

## Sources

### Primary (HIGH confidence)

- `npm view` registry — package versions (2026-03-23)
- [Vitest configuring](https://vitest.dev/config/) — `vitest/config`, `resolve.alias`, merge with Vite options
- [Socket.IO v4 testing](https://socket.io/docs/v4/testing/) — HTTP server + `socket.io-client` pattern
- Repo files: `package.json`, `src/app.ts`, `src/index.ts`, `src/config/envConfig.ts`, `src/services/socket.service.ts`, `src/constants/socket.constant.ts`, `src/routes/chats.route.ts`, `src/routes/friends.route.ts`, `src/services/auth.service.ts`, `src/controllers/auth.controller.ts`

### Secondary (MEDIUM confidence)

- `.planning/codebase/CONCERNS.md` — historical audit; cross-check against current tree via grep / file absence

### Tertiary (LOW confidence)

- Express 5 + supertest edge cases — verify on first green run; escalate if `supertest` needs swap to raw `fetch`

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — versions from npm registry; align with existing `socket.io` / `socket.io-client`
- Architecture: **MEDIUM** — `envConfig` + singletons need executor validation
- Pitfalls: **HIGH** — derived directly from `envConfig.ts` and route middleware

**Research date:** 2026-03-23  
**Valid until:** ~2026-04-22 (Vitest 4.x stable); re-check if major Vitest or Express minor bumps
