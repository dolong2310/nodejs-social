# Sandbox Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thanh toán order cố định 10.000 VND qua VNPay và MoMo sandbox, nhận IPN hợp lệ, lưu kết quả và cho chủ payment đọc trạng thái.

**Architecture:** Payment là một module clean architecture; use cases chỉ phụ thuộc repository và gateway ports. Hai gateway adapters bọc `@longdoo/node-payment-gateway`; MongoDB và PostgreSQL triển khai cùng repository contract. Composition root mount routes và adapters ở mọi môi trường ứng dụng; provider luôn dùng sandbox.

**Tech Stack:** TypeScript ESM, Express 5, MongoDB driver, pg, pnpm 11, Vitest, Supertest, `@longdoo/node-payment-gateway` 1.1.2.

**Spec:** `docs/superpowers/specs/2026-09-24-development-payment-design.md`

**Current status (2026-09-29):** Payment implementation exists. The current follow-up aligns its entity, mapper and persistence conventions with `user`. Application/test typechecks pass; the test suite has not been run. Keep changes unstaged and uncommitted for user review.

## Global Constraints

- Backend ấn định description và amount `10_000` VND; client chỉ chọn `vnpay` hoặc `momo`.
- Payment routes có mặt ở development/staging/production của ứng dụng; VNPay/MoMo luôn dùng `testMode:true` và endpoint sandbox. Không dùng sandbox `succeeded` để cấp hàng hóa hoặc quyền lợi có giá trị thật.
- Không có `PAYMENT_ENABLED`. Merchant credentials sandbox và public HTTPS callback base URL là bắt buộc để khởi động ứng dụng. Dùng tên biến merchant giống `nestjs-ecommerce`; giá trị thực chỉ ở cấu hình môi trường, không đưa vào repo.
- Chỉ IPN đã xác minh cập nhật trạng thái; browser return không settlement.
- Cả MongoDB và PostgreSQL bảo đảm unique reference/idempotency và cập nhật có điều kiện.
- Không hardcode merchant credentials; không log secret hoặc toàn bộ IPN.
- Trước khi sửa function/class/method cũ, chạy GitNexus impact upstream và báo HIGH/CRITICAL cho người dùng. Khi người dùng sẵn sàng commit, họ sẽ tự kiểm tra diff và phạm vi thay đổi. Không commit `.DS_Store` hiện đã bị sửa từ trước.
- Làm việc trên checkout hiện tại theo yêu cầu của người dùng để changes hiển thị trong `nodejs-social`. Không stage hoặc commit; người dùng sẽ review và tự commit.

## Review Focus

1. IPN đến trước create response: `pending` vẫn nhận checkout URL; kết quả cuối vẫn giữ trạng thái cuối khi gắn URL. Test trong Tasks 2–4.
2. Hai request cùng Idempotency-Key nhưng provider khác nhau: trả conflict, không gọi SDK lần hai. Test trong Task 3 và 4.
3. Provider đã nhận request nhưng kết nối timeout: giữ `unknown`, retry cùng key không tạo giao dịch mới. Phân biệt với phản hồi từ chối dứt khoát `create_failed`, chỉ khi gateway contract chứng minh được. Test trong Tasks 3, 5 và 6.
4. Callback giả mạo đúng chữ ký nhưng sai merchant/reference/amount: không đổi dữ liệu. Test trong Task 5 và 6.
5. Callback success lặp/đồng thời, hoặc failure đến sau success: side effect đúng một lần, trạng thái thành công không đảo. Test trong Tasks 2, 5 và 6.
6. VNPay `vnp_ExpireDate` bắt buộc, response IPN `{RspCode,Message}` chính xác với lỗi chữ ký/order/amount/storage; callback không đi qua generic error envelope. Test trong Task 5.
7. MoMo flow một bước `autoCapture=true`: `0/9000` thành công, `1000/7000/7002` chưa cuối. Gateway timeout tối thiểu 30 giây, HTTP timeout dài hơn; không coi Promise.race là hủy request. Test trong Tasks 6 và 7.

---

## File map và hợp đồng dùng chung

Các file dưới đây là sản phẩm dự kiến; tên có thể theo convention repo nếu implementer phát hiện tên hiện hành khác, nhưng interface và behavior phải giữ nhất quán.

```ts
type PaymentProvider = 'vnpay' | 'momo';
type PaymentStatus = 'creating' | 'pending' | 'unknown' | 'create_failed' | 'succeeded' | 'failed' | 'cancelled';
type PaymentOutcome = 'succeeded' | 'failed' | 'cancelled' | 'pending';

interface PaymentProps {
  userId: string;
  sourceType: 'order';
  sourceReference: string;
  description: string;
  amountVnd: number;
  currency: 'VND';
  provider: PaymentProvider;
  providerOrderId: string;
  providerRequestId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  status: PaymentStatus;
  checkoutUrl: string | null;
  expiresAt: Date | null;
  providerTransactionId: string | null;
  providerResultCode: string | null;
  version: number;
}

type PaymentFullProps = PaymentProps & {
  id: string;
  createdAt: Date;
  createdById: string | null;
  updatedAt: Date;
  updatedById: string | null;
  deletedAt: Date | null;
  deletedById: string | null;
};

type PaymentSafeProps = Pick<
  PaymentFullProps,
  | 'id'
  | 'sourceReference'
  | 'description'
  | 'amountVnd'
  | 'currency'
  | 'provider'
  | 'status'
  | 'checkoutUrl'
  | 'expiresAt'
  | 'createdAt'
  | 'updatedAt'
>;

type PaymentCheckoutProps = Pick<
  PaymentFullProps,
  'provider' | 'description' | 'amountVnd' | 'providerOrderId' | 'providerRequestId' | 'createdAt' | 'expiresAt'
>;

class PaymentEntity extends Entity<PaymentProps> {}

type VerifiedNotification = {
  provider: PaymentProvider;
  providerOrderId: string;
  providerRequestId?: string;
  amountVnd: number;
  providerTransactionId: string | null;
  resultCode: string;
  outcome: PaymentOutcome;
};

interface PaymentRepositoryPort {
  insertOrFindByIdempotency(payment: PaymentEntity): Promise<{ payment: PaymentEntity; inserted: boolean }>;
  findPaymentById(id: string): Promise<PaymentEntity | null>;
  findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentEntity | null>;
  attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentEntity>;
  setUnknownIfCreating(id: string): Promise<PaymentEntity>;
  setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentEntity>;
  applyVerifiedOutcome(
    input: VerifiedNotification
  ): Promise<'applied' | 'duplicate' | 'not_found' | 'amount_mismatch' | 'reference_mismatch' | 'state_conflict'>;
}

type CheckoutCreationError =
  | { kind: 'definitive_rejection'; resultCode: string }
  | { kind: 'uncertain'; reason: 'timeout' | 'network' | 'unclassified' };

interface PaymentGatewayPort {
  createCheckout(payment: PaymentCheckoutProps, clientIp: string): Promise<string>;
  verifyNotification(payload: unknown): VerifiedNotification;
}
```

`createCheckout` chỉ được throw lỗi đã phân loại `CheckoutCreationError` sau khi adapter đánh giá bằng chứng từ SDK/provider; exception không đủ dữ liệu phải thành `uncertain`. Đây là contract hành vi dù TypeScript không khai báo checked exceptions. Với VNPay, `expiresAt` bắt buộc: domain lưu UTC trước khi gọi SDK, adapter chuyển sang GMT+7 `yyyyMMddHHmmss` cho `vnp_ExpireDate`. Với MoMo, `expiresAt` có thể null nếu chưa có hạn checkout đáng tin cậy.

Repository adapters dùng primary DB để đọc trạng thái payment. `attachCheckoutUrlIfAbsent` gắn URL khi status là `creating/pending/unknown`, và có thể gắn khi đã cuối nhưng tuyệt đối không đổi trạng thái cuối; chỉ `creating` chuyển `pending`. `applyVerifiedOutcome` phải so khớp providerOrderId, amount, providerRequestId nếu provider trả về, và chỉ đổi `creating/pending/unknown` sang trạng thái cuối. `pending` chỉ cập nhật trạng thái chưa cuối, không ghi nhận thanh toán thành công. `duplicate` dành cho cùng kết quả đã ghi bền vững, cùng provider transaction ID khi có, thông báo chưa cuối lặp hợp lệ hoặc `pending` cũ sau kết quả cuối; cùng outcome nhưng transaction ID khác trả `state_conflict`. `not_found`, `amount_mismatch`, `reference_mismatch` tách riêng để map HTTP/IPN. Lỗi chữ ký và lưu trữ throw riêng. Provider transaction ID chỉ đưa vào unique index khi khác null/empty/sentinel.

## Task 1: Domain, ports, và state rules

**Files:**

- Create: `src/modules/payment/domain/entities/payment.entity.ts`, `payment.type.ts`
- Create: `src/modules/payment/domain/repositories/payment.repository.ts`
- Create: `src/modules/payment/application/ports/payment-gateway.port.ts`
- Test: `src/modules/payment/domain/entities/payment.entity.test.ts`

**Interfaces:** Produces `PaymentEntity`, `PaymentProps`, `PaymentFullProps`, `PaymentSafeProps`, `PaymentCheckoutProps`, `PaymentProvider`, `PaymentStatus`, `VerifiedNotification`, `PaymentRepositoryPort`, `PaymentGatewayPort` as above. Domain factory produces `p_<uuidv7>` ID and server-priced order snapshot.

- [ ] **Step 1: Write failing domain tests.** Assert `PaymentEntity.create({userId:'u_...', provider:'vnpay', idempotencyKey:'k1'})` yields `amountVnd===10000`, `currency==='VND'`, `status==='creating'`, an order reference and a future UTC `expiresAt`; MoMo may use null expiry. Reject blank user/key and unsupported provider. Assert `succeeded` cannot become `failed` through the state transition method; `create_failed` is distinct from provider payment `failed`.
- [ ] **Step 2: Run** `pnpm exec vitest run src/modules/payment/domain/entities/payment.entity.test.ts`; expect failing import/assertion.
- [ ] **Step 3: Implement entity/state rules and the exact contracts above.** Use current `generatePrefixId('p')`; generate provider order/request reference once and store before any SDK call. Give the order snapshot a stable description such as `Order payment`.
- [ ] **Step 4: Run test and** `pnpm typecheck`; expect pass. Leave changes for user review; do not stage or commit.

## Task 2: MongoDB và PostgreSQL persistence

**Files:**

- Create: `src/modules/payment/infrastructure/persistence/mongo/payment.impl.repository.ts`, `payment.mapper.ts`, `payment.model.ts`
- Create: `src/modules/payment/infrastructure/persistence/postgres/payment.impl.repository.ts`, `payment.mapper.ts`, `payment.model.ts`
- Create: `src/infrastructure/persistence/mongodb/migrations/20260924000000-payments.ts`
- Create: `src/infrastructure/persistence/postgres/migrations/20260924000000-payments.ts`
- Create: forward migrations `20260925000000-payments-source-type-order.ts` and `20260929000000-payments-audit.ts` for MongoDB and PostgreSQL.
- Test: `src/modules/payment/infrastructure/persistence/payment.repository.test.ts`

**Interfaces:** Consumes Task 1 types; produces both implementations of `PaymentRepositoryPort` and migrations. Mongo repository extends `MongoRepositoryBase<PaymentEntity, PaymentModel>`; PostgreSQL repository extends `PostgresRepositoryBase<PaymentEntity, PaymentModel>`. Both mappers implement `Mapper<PaymentEntity, PaymentModel, PaymentSafeProps>` and hydrate `PaymentEntity`. Avoid updating initial migrations already used by deployed databases.

- [ ] **Step 1: Write repository contract tests** driven by each adapter: concurrent `insertOrFindByIdempotency` yields one row; second request with same key and different fingerprint is returned to use case for conflict; two simultaneous success notifications yield exactly one `applied`; failure after success and same outcome with a different transaction ID are `state_conflict`; stale `pending` after success is no-op; early `pending` followed by `attachCheckoutUrlIfAbsent` preserves `pending` and stores URL; early success followed by URL attachment remains success. Test `not_found`, `amount_mismatch`, `reference_mismatch`, `setUnknownIfCreating`, `setCreateFailedIfCreating`, separate provider namespaces and transaction IDs exceeding SQL `Int`.
- [ ] **Step 2: Run** `pnpm exec vitest run src/modules/payment/infrastructure/persistence/payment.repository.test.ts`; expect failing import. For real DB tests, use test databases from environment, create/migrate isolated schema or database, and document setup in test file; do not silently skip both drivers in the final gate.
- [ ] **Step 3: Add PostgreSQL payments table** with `TEXT` references/IDs, `INTEGER` amount check `> 0`, status/provider checks including `create_failed`, UTC expiry timestamp, audit columns, unique `(user_id,idempotency_key)`, unique `(provider,provider_order_id)` and partial unique `(provider,provider_transaction_id)` where ID is valid. Implement conditional writes for URL attachment and outcomes; distinguish no match (`not_found`, amount/reference mismatch, duplicate, state conflict) by primary read. Add Mongo matching unique/partial indexes and atomic conditional updates; use primary `db`, never `readDb`. Keep the initial migration immutable; forward migrations normalize `source_type='example'` to `order` and add/backfill audit fields.
- [ ] **Step 4: Run both contract suites,** migration up/down checks, `pnpm typecheck`. Leave changes for user review; do not stage or commit.

## Task 3: Create checkout và owner read use cases

**Files:**

- Create: `src/modules/payment/application/use-cases/create-payment/create-payment.usecase.ts`, `.port.ts`
- Create: `src/modules/payment/application/use-cases/get-payment/get-payment.usecase.ts`, `.port.ts`
- Test: `src/modules/payment/application/use-cases/create-payment/create-payment.usecase.test.ts`
- Test: `src/modules/payment/application/use-cases/get-payment/get-payment.usecase.test.ts`

**Interfaces:** Consumes Task 1 ports. `execute({userId,provider,idempotencyKey,clientIp}): Promise<PaymentEntity>`; `get.execute({userId,paymentId}): Promise<PaymentEntity>` with ownership check.

- [ ] **Step 1: Write failing tests** using in-memory fake repository/gateway: first call persists `creating` before calling SDK and returns URL; same key/payload returns same payment and SDK call count remains 1; changed provider under same key is conflict; uncertain network/timeout error yields `unknown`; definitive provider rejection yields `create_failed` with result code; retry with either status does not call SDK again. Simulated IPN `pending` inside `createCheckout` retains checkout URL, and early success remains success after SDK returns. User B cannot read user A's payment.
- [ ] **Step 2: Run** `pnpm exec vitest run src/modules/payment/application/use-cases`; expect failure.
- [ ] **Step 3: Implement fingerprint** as SHA-256 of canonical `{sourceType:'order',provider,amountVnd:10000}`; persist first, create URL only for newly inserted row, check `inserted` and fingerprint; call `attachCheckoutUrlIfAbsent`; on uncertain SDK error call `setUnknownIfCreating`, on proven definitive rejection call `setCreateFailedIfCreating`. Both writes are conditional so early IPN cannot be overwritten. Map missing/foreign ID to same not-found response. Do not use Redis idempotency as correctness source.
- [ ] **Step 4: Run use-case tests and** `pnpm typecheck`; expect pass. Leave changes for user review; do not stage or commit.

## Task 4: IPN use case và callback semantics

**Files:**

- Create: `src/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase.ts`, `.port.ts`
- Test: `src/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase.test.ts`

**Interfaces:** `execute({provider,payload}): Promise<'applied'|'duplicate'|'not_found'|'amount_mismatch'|'reference_mismatch'|'state_conflict'>`. Invalid payload/signature and storage errors throw typed errors; neither is a success result.

- [ ] **Step 1: Write failing tests** for verified success, verified failure, verified `pending`, duplicate, concurrent success, early callback, missing reference, wrong amount/reference, state conflict and storage failure. Include a gateway fake that throws on invalid signature/merchant. Verify repository write is absent for invalid input and error propagates on DB failure.
- [ ] **Step 2: Run** `pnpm exec vitest run src/modules/payment/application/use-cases/handle-payment-notification`; expect failure.
- [ ] **Step 3: Implement** provider adapter selection, normalized notification validation and one call to `applyVerifiedOutcome`. A `pending` provider outcome must remain pending; `not_found`, mismatches and conflicts map to provider protocol at HTTP boundary, not to a successful write.
- [ ] **Step 4: Run tests and** `pnpm typecheck`; expect pass. Leave changes for user review; do not stage or commit.

## Task 5: VNPay SDK adapter and vertical HTTP slice

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml` to add a verified gateway package version; inspect whether registry 1.1.2 matches local source. If Task 6 needs a new create-result contract, use a tested published version or reproducible local package build containing that change.
- Create: `src/modules/payment/infrastructure/gateways/vnpay-payment-gateway.adapter.ts`
- Create: `src/presentation/http/express/v1/routes/payment.route.ts`, `payment-callback.route.ts`
- Create: `src/presentation/http/express/v1/controllers/payment.controller.ts`, `payment-callback.controller.ts`
- Create: `src/presentation/http/express/v1/pipes/payment.pipe.ts`, `dtos/payment/payment.request.dto.ts`, `dtos/payment/payment.response.dto.ts`
- Test: `src/modules/payment/infrastructure/gateways/vnpay-payment-gateway.adapter.test.ts`
- Test: `test/e2e/payment-vnpay.e2e.test.ts`

**Interfaces:** VNPay adapter implements Task 1 port. Controllers use Tasks 3/4. HTTP API paths/guards from spec; callbacks use raw Express response, no transform interceptor. Return handlers do not call settlement use case.

- [ ] **Step 1: Write failing adapter tests** with real SDK and deterministic sandbox credentials: create URL contains signed integer `10_000 VND` amount after SDK scaling and required `vnp_ExpireDate` in GMT+7 `yyyyMMddHHmmss`; valid signed IPN with `ResponseCode=00` and `TransactionStatus=00` succeeds; transaction status `01` remains pending; explicit cancellation/failure maps correctly; unknown code does not create terminal failure. Tampered hash, wrong merchant và missing reference bị từ chối tại adapter; signed amount sai so với bản ghi bị từ chối tại use case/repository và ra mã `04` ở HTTP. Assert no second amount scaling.
- [ ] **Step 2: Run** `pnpm exec vitest run src/modules/payment/infrastructure/gateways/vnpay-payment-gateway.adapter.test.ts`; expect failure. Implement adapter using `testMode:true`, `buildPaymentUrl` and `verifyIpnCall`; normalize SDK VND amount and map provider response codes.
- [ ] **Step 3: Write failing Supertest** for JWT create, owner GET, no-auth IPN, and exact VNPay `{RspCode,Message}` cases: applied `00`, duplicate `02`, missing order `01`, amount mismatch `04`, bad signature/merchant `97`, storage/state conflict `99`. Verify no generic `{message,errors}` envelope for errors, GET return read-only, wrong owner 404, malformed provider/body 4xx. Mount test container with fake persistence; callback controller must catch/map failures locally and bypass the generic response interceptor/filter.
- [ ] **Step 4: Implement presentation slice** and run `pnpm exec vitest run test/e2e/payment-vnpay.e2e.test.ts`, `pnpm typecheck`; expect pass. Leave changes for user review; do not stage or commit.

## Task 6: MoMo SDK adapter and callback slice

**Files:**

- Create: `src/modules/payment/infrastructure/gateways/momo-payment-gateway.adapter.ts`
- Modify: `src/presentation/http/express/v1/routes/payment-callback.route.ts`, `src/presentation/http/express/v1/controllers/payment-callback.controller.ts`
- Test: `src/modules/payment/infrastructure/gateways/momo-payment-gateway.adapter.test.ts`
- Test: `test/e2e/payment-momo.e2e.test.ts`

**Interfaces:** MoMo adapter implements Task 1 port; uses same use cases and repository. Chốt thanh toán ví một bước: truyền rõ `requestType='captureWallet'`, `autoCapture=true`, `orderId`, `requestId`, `extraData`. Với IPN hợp lệ của flow này, `resultCode=0/9000` là `succeeded`; `1000/7000/7002` là `pending`. Không dùng bảng này cho flow hai bước chưa có capture/cancel hoặc phương thức thanh toán khác.

- [ ] **Step 1: Write failing tests** for explicit `requestType/autoCapture/orderId/requestId/extraData`, configured partnerCode, signed IPN `0/9000` success, `1000/7000/7002` pending, documented terminal failure/cancellation, unknown code remaining nonterminal, wrong merchant, absent/invalid `payUrl`, and `responseTime` as epoch milliseconds if exposed. Validate signed amount/reference against the saved record in use case/repository tests, not in adapter-only tests. Simulate timeout and verify use case retains `unknown`/same reference; simulate proven provider rejection and verify `create_failed`.
- [ ] **Step 2: Run** `pnpm exec vitest run src/modules/payment/infrastructure/gateways/momo-payment-gateway.adapter.test.ts`; expect failure. Inspect SDK create behavior first. If the installed library exposes only `payUrl` or an undifferentiated exception, extend `node-payment-gateway` with a tested result/error contract that preserves HTTP status and MoMo `resultCode`, then consume that version/package in social. Until it exists, classify exceptions as uncertain; do not infer definitive rejection. Implement adapter with `testMode:true`, explicit one-step options and strict URL host `test-payment.momo.vn`. Set adapter deadline to at least 30 seconds (proposed 35 seconds); timeout remains `unknown` and must not be described as request cancellation.
- [ ] **Step 3: Write failing Supertest** for POST MoMo IPN returning 204 only after durable apply/duplicate, invalid signature/merchant/amount/reference not 204, DB error/state conflict not 204, GET return read-only. Implement MoMo callback routes and provider error mapping, completing each IPN promptly within MoMo's 15-second acknowledgement window.
- [ ] **Step 4: Run** `pnpm exec vitest run test/e2e/payment-momo.e2e.test.ts`, `pnpm typecheck`; expect pass. Leave changes for user review; do not stage or commit.

## Task 7: Sandbox config, DI, migrations wiring, docs

**Files:**

- Create: `src/bootstrap/config/payment.config.ts`, `src/bootstrap/di/payment.ts`
- Modify: `src/bootstrap/config/env.config.ts`, `src/bootstrap/container.ts`, `src/bootstrap/di/types.ts`, `src/bootstrap/di/repositories.ts`, `src/bootstrap/di/repositories/mongo.repo.ts`, `src/bootstrap/di/repositories/postgres.repo.ts`, `src/bootstrap/di/http-routes.ts`
- Modify: `.env.example`, `swagger/paths.yaml`, `swagger/components.yaml`, `swagger/tags.yaml`, `postman/COLLECTION_API.postman.json`, `README.vi.md`
- Test: `src/bootstrap/config/payment.config.test.ts`, `test/e2e/payment-sandbox.e2e.test.ts`

**Interfaces:** Exposes `buildPaymentModule({database,env,logger})` or equivalent wiring in existing composition root; adds repository to `ContainerRepositories` and payment route to `buildHttpRouters` in every app environment. Existing `IContainer` remains stable if possible.

- [ ] **Step 1: Write failing config tests** proving payment routes are available in development/staging/production when credentials and HTTPS callback base URL exist; missing config fails startup in each environment. Assert `testMode:true` and sandbox endpoints in each environment, and reject a non-sandbox `VNPAY_HOST`. Verify the payment create route has a 45-second HTTP deadline while the MoMo adapter has a shorter 35-second bounded wait; unrelated routes keep their existing timeout.
- [ ] **Step 2: Run** `pnpm exec vitest run src/bootstrap/config/payment.config.test.ts test/e2e/payment-sandbox.e2e.test.ts`; expect failure. Run GitNexus impact for every existing function/class/method being edited (`Container.constructor`, `buildHttpRouters`, repository factory functions, env setup) and report direct callers/processes/risk before editing them.
- [ ] **Step 3: Implement sandbox config and DI.** Add required payment keys to startup config using ecommerce names: `VNPAY_TMN_CODE`, `VNPAY_SECURE_SECRET`, `VNPAY_HOST`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_STORE_ID`, `MOMO_STORE_NAME`, plus social-specific `PAYMENT_PUBLIC_BASE_URL`. Configure SDK `testMode:true` independently of app environment and validate VNPay sandbox host. Wire Mongo/Postgres adapters, use cases, gateway adapters, controllers and routes in composition root for every environment. Ensure payment route works with each DB adapter. Place any per-route timeout in payment route wiring; existing `TimeoutInterceptor` races but does not abort provider fetch. Allow enough time after the 35-second adapter deadline to persist `unknown` and reply before the 45-second route deadline.
- [ ] **Step 4: Add API docs and a local test recipe** with merchant credential placeholders, HTTPS tunnel/registered IPN URLs, VNPay NCB test card and MoMo Test app steps. Document how to supply the same test merchant values as ecommerce without committing secrets, and state explicitly that sandbox success never moves real money. `README.vi.md` must distinguish automated tests from live sandbox smoke test.
- [ ] **Step 5: Run** `pnpm typecheck`, `pnpm typecheck:test`, `pnpm test`, `pnpm lint`, `pnpm build`; fix concrete regressions. Run migrations and DB integration suites for both adapters. Before handing changes back, inspect the diff and use GitNexus change detection if available. Leave all changes unstaged and uncommitted for the user.

## Task 8: Live sandbox verification and handoff

**Files:**

- Modify: `docs/superpowers/plans/2026-09-24-development-payment.md` only to record verified commands/outcomes; never write credentials or customer test details into tracked logs.

**Interfaces:** Requires sandbox merchant credentials and a reachable HTTPS IPN URL. This task does not alter application APIs.

- [ ] **Step 1: Start the app** with sandbox merchant credentials from the ecommerce deployment and a public HTTPS callback base URL. Apply the migration for the selected local DB driver and keep HTTPS tunnel active for a local run. Repeat the persistence check with the other driver when verifying both adapters. Check provider callback URLs resolve to the running server.
- [ ] **Step 2: VNPay smoke:** create authenticated order payment with unique Idempotency-Key; open checkout URL; complete NCB sandbox flow; observe signed IPN acknowledgement and `GET /payments/:id` `succeeded`; replay IPN and observe no state change.
- [ ] **Step 3: MoMo smoke:** repeat with MoMo Test app/approved sandbox method and its own merchant credentials; observe HTTP 204 IPN and persisted `succeeded`. Exercise cancellation/failure if sandbox supports it.
- [ ] **Step 4: Record evidence** of API status, payment ID redacted, database status and test commands. If merchant credentials or interactive wallet access are unavailable, mark live smoke unverified explicitly and hand off the exact remaining steps; automated passing tests do not count as provider E2E success.

## Plan self-review

- Spec coverage: domain, application, Mongo/Postgres, two adapters, IPN, return, HTTP, DI/config, docs and live sandbox are all assigned.
- Type consistency: `PaymentEntity`, `PaymentProps`, `PaymentFullProps`, `PaymentSafeProps`, `PaymentCheckoutProps`, `VerifiedNotification` and port signatures are defined once above; each task names its inputs/outputs.
- Review Focus: all seven cases appear in Tasks 2–7.
- No real-money provider integration, refunds, general order aggregate or query-based reconciliation is introduced.

## Convention-alignment follow-up

- `PaymentEntity` now carries persistence/use-case data; no plain `PaymentRecord` crosses repository, application or gateway boundaries.
- Both persistence mappers implement the shared `Mapper` contract, hydrate `PaymentEntity`, and map only whitelisted fields from `toResponse`.
- Mongo and PostgreSQL repositories extend their corresponding core base classes and follow `UserRepository` constructor/delegation style. Payment-specific writes remain custom conditional operations so idempotency and callback races stay atomic.
- `PaymentRepositoryPort` stays narrow and names its lookups `findPaymentById` and `findPaymentByProviderOrderId`, avoiding a conflict with the inherited `findById` that returns an entity.
- Forward audit migrations add/backfill the columns required by the base repositories; earlier migrations remain unchanged.
- Shared domain policy owns callback duplicate classification and provider transaction ID normalization.
- Current verification: `pnpm typecheck` and `pnpm typecheck:test` pass. Tests, DB migrations against live test databases, lint and build have not been run in this follow-up.
