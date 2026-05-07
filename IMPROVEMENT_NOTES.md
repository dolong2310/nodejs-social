# Improvement Notes

Ghi chú tổng hợp các vấn đề tồn đọng để cải thiện dần. File này là backlog kiến trúc/nghiệp vụ/bảo mật, không phải ADR chính thức.

## Session 2026-05-07 - Mongo/Postgres Persistence Adapter

### Bối cảnh đã chốt

- Runtime chỉ dùng một database driver qua `PERSISTENCE_DRIVER`; không fallback sang Mongo khi chọn Postgres.
- Mongo adapter giữ nguyên logic hiện tại, chỉ refactor path/naming khi cần.
- Mapper hiện tại đã được move từ `infrastructure/mappers` sang `infrastructure/mongo` cho các module.
- Postgres persistence dùng snake_case ở database/model; domain/application vẫn dùng camelCase.
- Postgres model naming dùng `*Schema` / `*Model`, đồng nhất concept với Mongo.
- Permission/role Postgres adapter đã được implement trước; user Postgres adapter là mục tiêu tiếp theo.
- `role_permissions` là join table cho quan hệ many-to-many giữa role và permission.
- `PostgresRepositoryBase` dùng `DbModel extends QueryResultRow` và transaction bằng `AsyncLocalStorage<PoolClient>`.

### Thiết kế database cần chặt chẽ hơn

- `initializeSchema()` hiện tạo schema trực tiếp bằng `CREATE TABLE IF NOT EXISTS`. Cách này ổn cho phase đầu, nhưng chưa có migration versioning, rollback, audit thay đổi schema, hoặc phân tách migration theo module.
- Schema Postgres đang tập trung trong root infrastructure. Khi nhiều module có Postgres adapter hơn, cần quyết định schema ownership: module tự cung cấp migration, hay root persistence gom migration toàn hệ thống.
- `role_permissions(position)` đang preserve thứ tự permissionIds, nhưng cần quy định rõ domain có thật sự cần order không. Nếu không cần, có thể bỏ `position`; nếu cần, cần unique `(role_id, position)` hoặc rule rõ khi reorder.
- `role_permissions` dùng `PRIMARY KEY (role_id, permission_id)`, nghĩa là duplicate permission id bị loại. Đây là hợp lý, nhưng cần document invariant trong domain/use case.
- `permissions.method` hiện là text. Nên cân nhắc CHECK constraint theo enum HTTP method để DB không nhận method invalid.
- `permissions.path + method` có unique constraint, nhưng cần quy định normalize path/method ở đâu để tránh `/users` và `/users/` hoặc lowercase/uppercase tạo dữ liệu lệch.
- `updated_at` được repository set khi update. Nếu sau này có SQL ngoài repository hoặc seed raw SQL, timestamp có thể lệch. Có thể cân nhắc DB trigger hoặc quy định mọi write phải đi qua repository/seed helper.
- `id` dùng text do domain tự sinh id. Cần giữ invariant độ dài/prefix ở domain, hoặc thêm CHECK nhẹ trong DB nếu muốn phát hiện dữ liệu ngoại lai.
- Khi implement user Postgres, cần thêm FK `users.role_id -> roles.id`, unique `users.email`, unique `users.username`, và index phục vụ login/search.
- Cần xem lại chiến lược full-text search Postgres cho user: Mongo đang dùng `$text`, Postgres nên có `tsvector`/GIN hoặc query `ILIKE` tạm thời với giới hạn rõ.

### Adapter/repository architecture

- `createPostgresContainerRepositories` hiện mới wire permission/role rồi fail-fast vì thiếu adapter các module còn lại. Đây là đúng theo quyết định không fallback, nhưng cần test riêng factory/module adapters để tránh Postgres code chỉ compile mà không chạy runtime.
- `createContainerRepositories` đang phụ thuộc config driver. Về lâu dài có thể truyền driver/factory rõ ràng hơn từ composition root để giảm hidden dependency trong DI.
- `PostgresRepositoryBase` chỉ support CRUD/equality đơn giản. Cần giữ giới hạn này rõ ràng để không biến base thành SQL builder nửa vời.
- `PostgresRepositoryBase` đang build column từ property name. Vì column/table name đều quote, SQL injection thấp nếu input là code-owned, nhưng vẫn nên whitelist field khi nhận `orderBy`/`projection` từ request hoặc DTO.
- `RepositoryPort.transaction(handler)` không truyền transaction context. `AsyncLocalStorage` giải quyết concurrency tốt hơn mutable field, nhưng cần test nested transaction và error rollback.
- Mongo base hiện dùng mutable `this.session`, có rủi ro concurrency nếu cùng repository instance xử lý nhiều request. Đây là vấn đề tồn đọng riêng của Mongo adapter.
- Mapper đã tách theo adapter, nhưng nhiều class vẫn tên chung như `RoleMapper` trong `mongo/`. Folder đã đủ context, nhưng nếu import alias phức tạp sau này có thể cân nhắc `MongoRoleMapper`.

### Nghiệp vụ cần rà lại

- `RoleRepository.createRole` ở Mongo từng có behavior upsert theo `{ name, description, isActive }`, trong khi use case đã check duplicate by name rồi dùng `insertRole`. Cần chuẩn hóa behavior repository: create là insert hay idempotent upsert?
- `PermissionRepository.deletePermission` có use case check `countRolesWithPermissionId` trước khi xóa, và Postgres FK cũng `ON DELETE RESTRICT`. Cần map lỗi FK/unique từ DB thành application exception rõ ràng thay vì leak lỗi SQL.
- `UpdateRoleUseCase` cho phép đổi `permissionIds` hàng loạt. Cần xác định behavior nếu có permission id không tồn tại: throw validation exception trước, hay để DB FK fail rồi map lỗi.
- System roles `ADMIN`/`USER` được bảo vệ ở use case, nhưng seed phải đảm bảo id/name ổn định và không tạo duplicate qua nhiều lần chạy.
- `RoleQueryRepository.findRoleWithPermissionsById` trả permissions theo `role_permissions.position`. Cần test parity với Mongo behavior hiện tại là preserve thứ tự `permissionIds`.
- Auth guard dùng `RoleQueryRepositoryPort`. Khi chuyển user sang Postgres, cần đảm bảo role active/inactive semantics được áp dụng đúng ở auth/authorization flow nếu nghiệp vụ yêu cầu.
- Khi implement user Postgres, các query safe user phải tiếp tục loại `password` và `totpSecret`, không được trả nhầm qua mapper/query repository.

### Bảo mật

- Seed scripts cần tuyệt đối tránh hardcoded URI, credentials, admin email/password, hoặc secret. Dùng env vars và document required env.
- Postgres config hiện có SSL option. Nếu dùng `rejectUnauthorized: false` trong môi trường production thì rủi ro MITM; cần tách config dev/prod hoặc hỗ trợ CA cert.
- Constraint errors từ Postgres có thể lộ table/column/internal SQL nếu trả thẳng ra HTTP. Cần error mapping ở repository/use case boundary.
- Permission seed dựa trên HTTP routes; cần kiểm soát route nào được expose thành permission để tránh vô tình cấp quyền cho route internal/static/debug.
- Admin seed cần bắt buộc password mạnh, hash bằng service hiện có, và tránh log password/token.
- Query repository cần đảm bảo không log PII nhạy cảm như email, password hash, TOTP secret.
- Khi thêm user Postgres search, tránh query pattern dễ DoS như `%term%` không index trên bảng lớn.

### Testing và verification còn thiếu

- `npm test` hiện fail vì thiếu `tests/setup/register-argv.mjs`. Cần sửa test harness trước khi tin vào test suite.
- Cần contract tests cho repository ports để Mongo/Postgres cùng satisfy behavior: permission, role, role query, sau đó user.
- Cần integration tests với Postgres thật, tốt nhất qua test database/container, để kiểm tra FK, unique constraint, transaction rollback, và order của `role_permissions`.
- Cần parity tests giữa Mongo và Postgres cho các use case quan trọng: create/update/delete permission, create/update/delete role, role with permissions.
- `createPostgresContainerRepositories` fail-fast có chủ ý, nhưng permission/role adapters nên có tests không cần full container.
- Build/lint chỉ chứng minh type/style, chưa chứng minh runtime schema và SQL hoạt động.

### Operational concerns

- Chưa có migration runner, rollback plan, hoặc migration history table.
- Chưa có pool tuning cho Postgres (`max`, idle timeout, connection timeout), healthcheck, hoặc graceful shutdown metrics.
- Schema creation trong app startup cần quyền DDL. Production thường nên tách quyền migrate khỏi quyền runtime app.
- Package lock đã thay đổi khi thêm `pg`; cần review lockfile churn trước commit.
- Git status sau mapper move sẽ hiển thị delete/add nếu chưa stage. Khi commit nên stage rename cẩn thận để review dễ hơn.

### Suggested next steps

1. Sửa test harness `tests/setup/register-argv.mjs` hoặc script `npm test`.
2. Viết contract/integration tests cho permission + role Postgres adapters.
3. Implement user Postgres adapter sau khi có tests nền.
4. Thêm schema `users` với FK/unique/index/search strategy rõ ràng.
5. Tách migration strategy khỏi `initializeSchema()` khi số module Postgres tăng.
6. Rà seed scripts để loại hardcoded secret/URI và đảm bảo idempotency.

## Bổ sung 2026-05-07 - Auth-critical path và persistence hardening

### Bối cảnh mới trong session

- Auth-critical Postgres adapter đã mở rộng từ `permission/role` sang `user`, `otp`, `refresh-token`.
- Postgres repository/mapper class trong folder `postgres/` đã bỏ tiền tố `Postgres` để đồng nhất với Mongo naming; folder path là context phân biệt adapter.
- `otps` giữ domain shape hiện tại theo `email`, không thêm `user_id` FK vì OTP register tồn tại trước khi user được tạo.
- `otps` đã đổi invariant sang unique `{ email, type }`; create OTP sẽ replace/upsert `code` và `expiresAt`.
- `refresh_tokens` dùng FK cứng `user_id -> users(id) ON DELETE CASCADE`, `token UNIQUE`, và index `expires_at` để phục vụ cronjob cleanup.
- Mongo `refreshTokens.expiresAt` đã đổi từ TTL index sang regular index để tránh database tự xóa trước khi cronjob kiểm soát lifecycle.

### Thiết kế database còn thiếu chặt chẽ

- `initializeSchema()` và `initializeIndexes()` vẫn đang làm nhiệm vụ migration ngầm ở app startup. `CREATE TABLE IF NOT EXISTS` và `CREATE INDEX IF NOT EXISTS` không đủ để evolve schema đã tồn tại, ví dụ thêm CHECK/UNIQUE/FK mới hoặc đổi TTL index thành regular index.
- Mongo đang drop TTL index `refreshTokens.expiresAt_1` ngay trong startup nếu phát hiện TTL. Đây là migration thật, có rủi ro operational nếu app runtime không nên có quyền DDL hoặc nếu nhiều instance cùng chạy.
- Sau khi bỏ TTL index, expired refresh token sẽ không tự biến mất nữa. Cần cronjob chính thức trước production, nếu không bảng/collection token sẽ tăng vô hạn.
- Postgres đã có index `refresh_tokens(expires_at)` và Mongo có index `refreshTokens.expiresAt`, nhưng chưa có repository/use-case cleanup API chung cho cả hai adapter.
- `otps.expiresAt` cũng chỉ có index, chưa có cronjob cleanup. Hiện expired OTP chỉ bị xóa khi user validate đúng email/type và gặp expiry path.
- Unique index Mongo `{ email, type }` cho `otps` có thể fail khi database đã có dữ liệu duplicate từ behavior cũ. Cần migration dedupe trước khi deploy lên database có dữ liệu thật.
- Postgres `users.email` và `users.username` unique nhưng chưa rõ normalization/case-insensitive strategy. Nếu application không normalize, `Foo@x.com` và `foo@x.com` có thể thành hai account khác nhau.
- `UpdateMeUseCase` hiện có xu hướng set optional profile fields thành empty string. Với `username TEXT UNIQUE`, nhiều user cùng `''` có thể gây conflict; nên dùng `NULL` cho optional fields hoặc normalize ở domain/use case.
- User search Postgres hiện dùng `ILIKE '%term%'`, không tận dụng index thường và có rủi ro chậm/DoS trên bảng lớn. Cần `tsvector`/GIN, trigram index, hoặc search service rõ ràng.
- `refresh_tokens.token` đang lưu plaintext token. DB leak sẽ thành credential leak trực tiếp; nên cân nhắc hash refresh token trước khi lưu và lookup bằng hash.
- `otps.code` đang lưu plaintext OTP. Nên cân nhắc hash OTP code tương tự password/token để giảm blast radius khi DB leak.
- `users.totp_secret` là secret nhạy cảm. Cần quyết định encrypt-at-rest hoặc dùng secret storage/KMS thay vì lưu plaintext trong DB.

### Nghiệp vụ/auth flow cần rà lại

- Refresh token rotation chỉ update token trong DB sau khi JWT verify và user lookup. Cần test race condition khi cùng một old refresh token bị gửi song song nhiều lần.
- `RefreshTokenUseCase` dựa vào JWT expiry để reject token hết hạn; DB `expires_at` hiện chủ yếu phục vụ cleanup. Cần document rõ DB expiry có phải enforcement hay chỉ retention metadata.
- Logout behavior trả success nếu token không tồn tại. Đây là idempotent tốt, nhưng cần logging/rate-limit để không che giấu token probing quy mô lớn.
- OTP unique `{ email, type }` nghĩa là gửi OTP mới làm invalid OTP cũ. Đây là hợp lý, nhưng cần rate limit theo email/type/IP để tránh spam email và brute force.
- OTP validation đang tìm theo `{ email, type }` rồi compare code trong application. Cần đảm bảo error message và timing không giúp phân biệt email/type tồn tại hay code sai.
- Register flow phụ thuộc OTP trước khi tạo user; vì vậy không nên thêm FK `otps.user_id` nếu chưa redesign toàn bộ OTP lifecycle.
- Google login và email login cần kiểm tra lại option `isCreateInDatabase` khi tạo auth session để đảm bảo refresh token được persist nhất quán ở mọi login path.
- Role active/inactive semantics vẫn chưa rõ trong login/refresh/auth guard. Nếu role inactive thì user còn login/refresh được không?
- Permission seed từ route discovery cần review route nào là public/internal/debug để tránh tự động tạo permission quá rộng.

### Adapter/repository architecture còn nông

- Auth-critical Postgres adapters đã có, nhưng `createPostgresContainerRepositories` vẫn fail-fast vì các module ngoài auth chưa có adapter. Cần tách khái niệm "auth-only runtime" và "full app runtime" nếu muốn chạy một phần hệ thống với Postgres.
- Repository ports chưa có contract tests chung cho Mongo/Postgres. Rủi ro lớn nhất hiện tại là hai adapter compile cùng interface nhưng lệch behavior ở edge cases.
- `PostgresRepositoryBase` vẫn phù hợp cho CRUD đơn giản, nhưng các query quan trọng đã phải viết SQL riêng. Cần tránh mở rộng base thành SQL builder thiếu kiểm soát.
- Query repositories đang trả DTO/projection thủ công. Cần test rõ các safe query không leak `password`, `totpSecret`, refresh token, OTP code.
- Error mapping từ Postgres unique/FK/CHECK constraint sang application exception chưa có lớp thống nhất, dễ leak SQL detail hoặc tạo HTTP 500 thay vì lỗi nghiệp vụ.
- Mongo index creation có helper `indexExistsSafe`, nhưng thiếu migration metadata. Khi index option thay đổi, code phải tự detect/drop từng case thủ công.

### Bảo mật cần ưu tiên

- Hash refresh token at rest trước khi lưu DB.
- Hash OTP code at rest hoặc ít nhất giảm TTL/retention và thêm cleanup cronjob.
- Encrypt hoặc bảo vệ `totpSecret` bằng KMS/secret manager.
- Thêm rate limiting cho send OTP, validate OTP, login, refresh-token rotation, forgot-password.
- Không log email/token/OTP/TOTP secret/password hash trong repository/query/service logs.
- Map constraint errors thành domain/application errors an toàn, tránh trả table/column/SQL detail cho client.
- Rà seed admin: password phải đến từ env, được hash bằng hashing service, không log secret, và phải idempotent.

### Testing và verification còn thiếu

- `npm test` vẫn fail vì thiếu `tests/setup/register-argv.mjs`; đây là blocker trước khi tin vào regression suite.
- Cần contract tests cho auth-critical repository ports: `UserRepositoryPort`, `UserQueryRepositoryPort`, `OtpRepositoryPort`, `RefreshTokenRepositoryPort`, `RoleRepositoryPort`, `RoleQueryRepositoryPort`.
- Cần integration tests với Mongo thật hoặc test container để verify unique index `{ email, type }` và migration TTL -> regular index cho `refreshTokens.expiresAt`.
- Cần integration tests với Postgres thật để verify FK `refresh_tokens.user_id`, unique token, `ON DELETE CASCADE`, OTP upsert `ON CONFLICT(email, type)`, và `expires_at` indexes.
- Cần concurrency tests cho refresh-token rotation và OTP resend cùng email/type.
- Cần parity tests cho login/register/refresh/logout giữa Mongo và Postgres adapters.

### Suggested next steps bổ sung

1. Sửa test harness để `npm test` chạy được.
2. Thêm contract tests cho `otp` và `refresh-token` repositories trước.
3. Viết migration/dedupe plan cho Mongo `otps` duplicate trước khi bật unique `{ email, type }` trên dữ liệu thật.
4. Implement cronjob cleanup cho expired `refresh_tokens` và `otps` ở cả Mongo/Postgres.
5. Hash refresh tokens và OTP codes at rest.
6. Quyết định normalization/case-insensitive uniqueness cho email/username.
7. Tách migration runner khỏi app startup, hoặc ít nhất ghi rõ quyền DDL chỉ dùng trong dev/early phase.

## Bổ sung 2026-05-07 - Social graph và post persistence adapters

### Bối cảnh mới trong session

- Postgres adapter đã được mở rộng cho `block`, `friend`, `hashtag`, `like`, `bookmark`, và `post`.
- Runtime vẫn theo quyết định không hybrid fallback: `postgres.repo.ts` còn fail-fast cho tới khi toàn bộ repository còn lại được implement.
- Các bảng mới tiếp tục dùng `id TEXT PRIMARY KEY`, snake_case, và FK `ON DELETE CASCADE` khi dữ liệu thuộc vòng đời của user/post.
- `posts` tạm giữ Mongo-like shape bằng `TEXT[]` cho `hashtags`/`mentions` và `JSONB` cho `media` để hoàn tất migration trước; schema đã có comment nhắc cần revisit khi post update thêm `content`, `hashtags`, `mentions`, `media`.
- Query post đã cố preserve behavior Mongo hiện tại: cursor `created_at DESC, id DESC`, mention output không trả `email`, hashtag/mention aggregation giữ thứ tự array.
- Post thiếu like/bookmark count.

### Thiết kế database còn thiếu chặt chẽ

- `posts.hashtags`, `posts.mentions`, và `posts.media` đang là dữ liệu denormalized. Cách này giảm scope migration nhưng làm yếu referential integrity: DB không biết hashtag id/user mention id/media object có tồn tại hoặc hợp lệ không.
- `likes.post_id` và `bookmarks.post_id` ban đầu được tạo trước `posts`, sau đó mới add FK bằng guarded `DO` block. Đây là giải pháp chuyển tiếp, nhưng migration thật nên quản lý dependency order rõ ràng thay vì DDL điều kiện trong startup.
- `posts.parent_id` là self-FK nhưng chưa có CHECK chặn parent trỏ chính nó, chưa enforce rule theo `type` như comment/repost/quote phải hoặc không được có parent.
- `posts.type`, `posts.audience`, và `media.type` hiện chỉ enforce một phần. `media` nằm trong JSONB nên DB chưa validate từng item có đủ `url`, `type`, dimensions hoặc metadata hợp lệ.
- `friendships` dùng canonical pair `user_id_low/user_id_high` và CHECK `user_id_low < user_id_high`. Invariant này đang dựa trên string ordering của id; nếu sau này đổi format id, cần đảm bảo ordering vẫn ổn định.
- `friend_requests` giữ unique cùng chiều `(from_user_id, to_user_id)`. DB chưa chặn song song hai request ngược chiều nếu nghiệp vụ muốn chỉ một pending relationship giữa hai user.
- `blocks` unique theo `(blocker_id, blocked_id)`, nhưng chưa có DB-level rule cleanup các friend request/friendship liên quan khi block xảy ra. Nếu nghiệp vụ yêu cầu block làm hủy quan hệ xã hội, hiện tại phải nằm ở use case.
- `hashtags.name` unique nhưng chưa rõ normalization/case-insensitive strategy. `NodeJS`, `nodejs`, và `nodejs ` có thể trở thành dữ liệu khác nhau nếu application không normalize triệt để.
- Counter fields `guest_views`, `user_views`, like count/bookmark count/comment count đang được tính hoặc increment rời rạc. Chưa có strategy nhất quán giữa "counter materialized" và "count from source table".

### Nghiệp vụ cần rà lại

- Block semantics chưa được gom thành một policy rõ: block có ngăn friend request, hủy friendship, ẩn post, chặn mention/comment/like/bookmark không? Một phần visibility đã xét block trong query post, nhưng các write path khác cần kiểm tra.
- Friend request duplicate behavior đang preserve Mongo edge case: duplicate Postgres `23505` throw string/message ở adapter đầu tiên. Đây là parity tốt cho migration, nhưng là interface xấu; nên map thành application error ổn định sau khi migration qua giai đoạn rủi ro cao.
- Friendship duplicate `23505` trả `null` giống Mongo. Cần document đây là idempotent create hay lỗi nghiệp vụ bị nuốt, vì caller có thể hiểu sai.
- `findFriendIdsByUserId`/block id list có nơi cố tình chỉ trả unique ids và không introduce ordering. Nếu caller sau này dùng output để phân trang hoặc hiển thị, cần thêm interface mới có ordering rõ thay vì dựa vào DB incidental order.
- Post query visibility hiện nằm trong SQL adapter khá dày: audience, block, friendship, explicit visible ids, search filters. Đây là logic nghiệp vụ quan trọng nhưng test surface hiện chưa đủ rõ.
- Search post dùng PostgreSQL `simple` full-text search. Behavior có thể lệch Mongo text search về stemming, stop words, ranking, tokenization, và ngôn ngữ tiếng Việt.
- `insertBulk` hashtag không update `updated_at` cho existing hashtag. Đây có thể đúng nếu `updated_at` nghĩa là metadata thay đổi, nhưng sai nếu muốn track last-used time.
- Like/bookmark create đang idempotent bằng `ON CONFLICT DO NOTHING` rồi select lại row. Cần xác định `updated_at` có nên giữ thời điểm tạo đầu tiên hay phản ánh lần user tương tác gần nhất.
- `increasePostsViews` bulk update unique ids nhưng chưa có dedupe/anti-spam strategy theo viewer/session/IP. View count hiện dễ bị inflate nếu endpoint bị gọi lặp.

### Bảo mật và privacy

- Post visibility là security-sensitive. Cần integration tests chứng minh blocked user không thấy post/friend-only post trong mọi query path, không chỉ feed chính.
- Mention aggregation hiện trả `id`, `name`, `username`, `status` và cố tình không trả `email`. Cần giữ contract này bằng tests để tránh mapper/query khác leak email.
- Search và filter post có thể tạo query tốn kém nếu input không bị giới hạn độ dài, page size, hoặc rate limit.
- `media` JSONB có thể chứa URL hoặc metadata do user cung cấp. Cần validate scheme/domain/size ở write path để tránh lưu URL độc hại, SSRF vector ở downstream media processor, hoặc payload quá lớn.
- Block/friend graph là privacy data. Cần kiểm soát logs/debug traces không in danh sách block/friend/visible ids quá rộng.
- Constraint error mapping vẫn chưa thống nhất. FK/unique/check từ các social adapters có thể leak tên bảng/cột nếu exception đi thẳng ra HTTP.

### Adapter/repository architecture còn nông

- Các Postgres query repository cho post đang chứa nhiều SQL hand-written và DTO mapping thủ công. Interface của repository nhỏ, nhưng implementation đang gánh nhiều policy; cần contract tests để giữ locality thay vì để bug chỉ xuất hiện ở controller/use case.
- Mapper cho post phải bridge domain `Media` value object, JSONB plain object, và output DTO. Đây là seam dễ lệch shape khi thêm update content/hashtags/mentions/media.
- `initializeSchema()` đã phình to theo từng module. Khi thêm notification/conversation/media tiếp theo, root persistence sẽ ngày càng khó review và khó rollback.
- Không có shared helper cho Postgres duplicate/FK/CHECK error mapping, nên mỗi adapter đang tự preserve Mongo behavior theo kiểu cục bộ.
- DI Postgres vẫn không chạy full app vì còn module thiếu adapter. Điều này tốt hơn fallback ngầm, nhưng làm runtime verification bị trì hoãn tới cuối migration.

### Testing và verification còn thiếu

- Build/lint đã pass, nhưng SQL chưa được chạy qua Postgres thật trong session. Rủi ro còn nằm ở constraint order, JSONB casts, lateral aggregates, cursor edge cases, và FK cascade.
- Cần contract tests cho `BlockRepositoryPort`, `FriendRequestRepositoryPort`, `FriendshipRepositoryPort`, `HashtagRepositoryPort`, `LikeRepositoryPort`, `BookmarkRepositoryPort`, `PostRepositoryPort`, `PostCommandRepositoryPort`, và `PostQueryRepositoryPort`.
- Cần parity tests Mongo/Postgres cho duplicate behavior: block duplicate throw, friendship duplicate null, friend request duplicate throw message/string, like/bookmark idempotent create.
- Cần integration tests cho post visibility: guest, owner, friend, non-friend, blocked, friends-only, only-me, visible post ids, and interacted authors.
- Cần tests cho cursor semantics `created_at DESC, id DESC`, đặc biệt khi nhiều row có cùng `created_at`.
- Cần tests cho cascade delete: delete user/post phải cleanup block/friend/like/bookmark/post children đúng kỳ vọng.
- `npm run lint` còn pass với warnings cũ ở các module khác. Nên dọn dần để warnings không che lỗi mới.

### Suggested next steps bổ sung

1. Implement `notification` Postgres adapter tiếp theo, nhưng trước đó chốt lifecycle theo user/post/comment/like/friend events và FK cascade cần thiết.
2. Viết integration test nhỏ chạy schema Postgres thật cho các adapter social đã migrate.
3. Tách migration runner hoặc ít nhất tách schema definition theo module để giảm rủi ro `initializeSchema()` quá lớn.
4. Thêm error mapping thống nhất cho Postgres constraint errors.
5. Chốt post normalization roadmap: `post_hashtags`, `post_mentions`, `post_media` hoặc giữ JSONB lâu dài với validator rõ.
6. Bổ sung privacy/visibility tests trước khi mở rộng notification, vì notification rất dễ leak sự tồn tại của post/user interaction bị block.

## Bổ sung 2026-05-07 - Notification, conversation và media persistence adapters

### Bối cảnh mới trong session

- Postgres adapter đã được mở rộng thêm cho `notification`, `conversation`, `conversation_member`, `chat_message`, `conversation_member_query`, và `video_status`.
- `notification.actor`, `notification.payload`, và `chat_messages.attachments` tạm giữ Mongo-like shape bằng `JSONB` để giảm scope migration.
- Conversation đã được tighten sau `/grill-me`: `chat_messages.sender_id`, `conversations.created_by`, `user_id_low`, `user_id_high` chuyển sang `ON DELETE RESTRICT`; `conversation_members.user_id` vẫn cascade.
- Direct conversation bắt buộc không có `name/avatar_media_id`; group conversation bắt buộc không có `user_id_low/user_id_high`.
- `video_status` dùng singular table name theo quyết định trong session, dù đa số bảng Postgres hiện đang plural.
- `VideoStatusRepository` chỉ migrate persistence của encoding status; storage/S3/file processing/queue vẫn giữ nguyên infrastructure hiện tại.

### Thiết kế database còn thiếu chặt chẽ

- `notifications.actor` và `notifications.payload` là `JSONB`, nên DB chưa enforce shape theo từng `type`. App layer có valibot mapper, nhưng raw SQL hoặc migration data vẫn có thể đưa payload sai vào bảng.
- `notifications.actor.userId` là snapshot embedded, không có FK. Đây preserve behavior Mongo và display snapshot, nhưng DB không biết actor còn tồn tại hay đã bị xóa.
- `notifications.payload` có thể chứa `conversationId`, `messageId`, `fromUserId`, `friendUserId` nhưng chưa có FK. Vì conversation vừa migrate xong, cần quyết định sau có normalize payload hay tiếp tục JSONB lâu dài.
- `notifications.read_at` đang default `NOW()` và mapper Mongo trước đó cũng default `readAt` khi missing, nhưng domain response hiện không map `readAt` từ persistence. Semantics "unread nhưng read_at đã có timestamp" cần được xem lại.
- Notification trim dùng `ORDER BY read DESC, created_at ASC, id ASC`, nghĩa là ưu tiên xóa notification đã đọc trước. Đây hợp lý, nhưng cần document vì dễ bị hiểu là "oldest only".
- Conversation FK `ON DELETE RESTRICT` cho creator/direct pair/sender bảo vệ history, nhưng làm user deletion có thể fail. Cần thiết kế user lifecycle rõ: hard delete, soft delete, tombstone user, hay anonymization.
- `conversation_members.user_id ON DELETE CASCADE` có thể xóa membership trong khi `chat_messages.sender_id ON DELETE RESTRICT` chặn xóa user. Hai quyết định này hợp lý riêng lẻ, nhưng user deletion policy tổng thể chưa nhất quán.
- `conversation_members.last_read_message_id` giữ `TEXT` không FK để match Mongo. Cần revisit nếu sau này cần read-state integrity mạnh hơn.
- `chat_messages.attachments` chỉ check JSON array, chưa check từng object có `key`, `mime`, `size`, `url`. Đây là guardrail tối thiểu, không phải DB validation đầy đủ.
- `video_status.name UNIQUE` biến filename/idName thành natural key. Cần đảm bảo upload filename generation thật sự collision-resistant; nếu không, duplicate `23505` sẽ surface ở upload flow.
- `video_status.message` nullable khi insert nhưng update không có message sẽ set `''` để match Mongo. Đây là mixed semantics `NULL` vs empty string, cần document hoặc normalize sau.
- Idempotent DDL trong `initializeSchema()` đã tăng thêm `DROP/ADD CONSTRAINT`. Nếu DB đã có dữ liệu vi phạm constraint mới, app startup sẽ fail. Cần migration precheck/dedupe/cleanup thay vì để runtime tự nổ.
- `initializeSchema()` tiếp tục phình to và chứa nhiều module ownership cùng một nơi. Đây là điểm nghẽn review, rollback, và deploy nhiều instance.

### Nghiệp vụ cần rà lại

- Notification list chỉ filter block theo `actor.userId`. Payload vẫn có thể chứa id của user/conversation/message mà viewer không nên biết trong một số flow. Cần review từng notification type để tránh leak qua payload.
- Notification create không kiểm block ở repository; logic block nằm ở use case/service tuỳ flow. Cần policy tập trung: khi nào block ngăn tạo notification, khi nào chỉ filter lúc đọc.
- New message notification cho group lọc block với sender, nhưng realtime emit vẫn gửi message cho member trong phòng. Cần xác định block trong group chat chỉ ảnh hưởng notification hay cả visibility/realtime.
- `createNotifications` large group insert many rồi enqueue trim background. Nếu trim queue fail, user có thể vượt `NOTIFICATION_MAX_PER_USER`. Đây là eventual consistency có chủ ý hay cần recovery job?
- `createNotifications` Postgres không dùng `ON CONFLICT` và sẽ fail toàn batch nếu trùng id. Với generated id thì rủi ro thấp, nhưng behavior khác Mongo `insertMany(..., ordered:false)` khi một document fail.
- Direct conversation duplicate `23505 -> null` match Mongo `11000 -> null`, nhưng interface `null` có thể bị hiểu nhầm là "không tạo được vì không tồn tại". Cần application-level naming/error rõ hơn sau migration.
- `createGroupConversation` duplicate member trong input vẫn để DB unique throw. Đây match quyết định session, nhưng use case nên validate duplicate memberIds sớm để trả lỗi nghiệp vụ sạch.
- `transferAdminRole` không check `rowCount`, match Mongo updateOne behavior. Use case phải chịu trách nhiệm validate old/new member tồn tại và role hợp lệ; cần tests cho các precondition này.
- `updateRole` và `updateReadState` giờ set `updated_at`, nhưng `listConversationsForUser` sort theo `conversations.updated_at`, không theo member `updated_at`. Nếu product muốn "mark read" không bump conversation list, hiện tại đúng; nếu muốn unread/read activity tracking, cần field/query riêng.
- `VideoStatusRepository.updateVideoStatus` trả `rowCount > 0`, không strict mimic Mongo `modifiedCount > 0`. Update cùng giá trị có thể trả `true`. Đây là pragmatic decision cần giữ trong contract tests.
- `GetVideoStatusUseCase` lookup bằng `name`. Nếu name đoán được từ filename/idName, người dùng có thể query status của video không thuộc họ nếu endpoint không kiểm ownership.

### Bảo mật và privacy

- Notification payload có thể leak sự tồn tại của conversation/message/user interaction nếu viewer bị block sau khi notification được tạo. Filter lúc read chưa chắc đủ nếu payload đã realtime emit trước đó.
- Realtime notification emit không có persistence-level privacy check. Cần audit từng event path: friend request, friend accepted, new message, added to group.
- `GetVideoStatus` cần authorization hoặc unguessable id/name. Nếu status endpoint public theo name, đây là IDOR/privacy risk cho video processing metadata.
- Video upload/stream pipeline vẫn cần hardening ngoài persistence: MIME validation, file size limit, path traversal defense, cleanup on failure, S3 key normalization, content type control.
- `video_status.message` lưu error message từ queue/worker. Error có thể chứa local path, S3 key, stack snippet, hoặc infrastructure detail. Cần sanitize trước khi trả client.
- `chat_messages.attachments.url` và notification payload text có thể chứa user-controlled data. Cần đảm bảo output encoding ở client và không dùng URL để server-side fetch không kiểm soát.
- Constraint errors từ new tables (`video_status_name_unique`, conversation shape checks, notification FK) vẫn chưa có central safe mapping sang application errors.

### Adapter/repository architecture còn nông

- Postgres adapters hiện preserve Mongo behavior cục bộ bằng hand-written SQL. Chưa có shared contract suite để chứng minh mỗi adapter satisfy cùng interface.
- JSONB bridge ở notification/chat-message/media tạo seam dễ lệch: valibot model, domain entity, DB constraint, và response DTO có thể drift nếu thêm notification type hoặc attachment metadata mới.
- `VideoStatusRepository` dùng base `insert(entity)`, còn update/find viết SQL riêng. Đây ổn, nhưng cần tests vì natural key là `name`, không phải `id`.
- DI Postgres đã có nhiều adapter hơn nhưng vẫn fail-fast vì còn module còn thiếu. Runtime full Postgres chưa được exercise end-to-end.
- GitNexus index chưa nhận biết một số Postgres files mới/untracked, nên impact analysis resolve sang Mongo classes. Cần re-run `npx gitnexus analyze` sau khi ổn định để future impact chính xác hơn.

### Testing và verification còn thiếu

- Build/lint pass, nhưng chưa chạy schema trên Postgres thật. Rủi ro còn ở DDL `DO $$`, constraint add/drop, JSONB checks, unique constraints, và existing-data violations.
- Cần contract tests cho `NotificationRepositoryPort`, `ConversationRepositoryPort`, `ConversationMemberRepositoryPort`, `ChatMessageRepositoryPort`, `ConversationMemberQueryRepositoryPort`, và `VideoStatusRepositoryPort`.
- Cần integration tests cho notification cursor, unread filter, actor block filter, trim ordering, bulk create, and delete by ids.
- Cần integration tests cho conversation direct duplicate race, group creation transaction rollback, member duplicate error, transfer admin, update read state, and conversation list cursor.
- Cần integration tests cho chat message attachment JSONB, empty message check, cursor same timestamp tie-breaker, and sender FK restrict.
- Cần integration tests cho `video_status`: insert via base repository, duplicate name `23505`, update message `undefined -> ''`, lookup by name, and status/name CHECK constraints.
- Cần privacy tests cho notification/realtime paths khi block xảy ra trước và sau event creation.
- `npm test` vẫn là blocker nếu test harness chưa sửa; hiện verification chủ yếu là `npm run build` và `npm run lint`.

### Suggested next steps bổ sung

1. Chạy Postgres schema init trên database thật/test container để phát hiện lỗi DDL sớm.
2. Viết contract tests cho `VideoStatusRepositoryPort` trước vì scope nhỏ và ít dependency.
3. Viết contract tests cho chat message cursor/attachments vì đây là đường dữ liệu user-facing và dễ lệch Mongo.
4. Thiết kế user deletion policy: hard delete bị restrict, soft delete, hay tombstone/anonymize.
5. Chốt notification privacy policy theo từng type, đặc biệt block và realtime emit.
6. Tách migration runner hoặc chia schema theo module trước khi `initializeSchema()` tiếp tục phình.
7. Re-run `npx gitnexus analyze` sau khi stage/commit các Postgres files mới để impact analysis không còn resolve nhầm sang Mongo.
