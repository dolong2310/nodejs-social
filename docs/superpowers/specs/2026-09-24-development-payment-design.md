# Payment sandbox cho nodejs-social — thiết kế đề xuất

Trạng thái: thiết kế đã được review và đang được triển khai trong `nodejs-social`.

## Mục tiêu và phạm vi

Tái sử dụng `@longdoo/node-payment-gateway` để thanh toán VNPay và MoMo sandbox ở mọi môi trường chạy của `nodejs-social`, kể cả khi ứng dụng được chạy với cấu hình production. Người dùng đã đăng nhập tạo checkout cho một order mẫu do backend cung cấp, mở URL thanh toán, hoàn thành trên sandbox và xem trạng thái được lưu trong database qua IPN. `succeeded` ở đây chỉ có nghĩa thanh toán sandbox thành công, không có tiền thật được thu.

Nghiệp vụ mua hàng chưa được xác định. Bản đầu dùng một order cố định giá 10.000 VND; mỗi lần tạo hợp lệ sinh reference riêng và lưu snapshot tên, số tiền, tiền tệ. Client chỉ chọn provider; không được quyết định số tiền, người sở hữu hay callback URL.

Ngoài phạm vi bản đầu: kết nối merchant/provider production để thu tiền thật, giỏ hàng, tồn kho, subscription, hoàn tiền, nhiều lần thử thanh toán trên cùng một business order, realtime notification và job đối soát tự động. Có thể thêm các phần này khi xuất hiện nghiệp vụ cụ thể. Không dùng kết quả thanh toán sandbox để cấp sản phẩm hoặc quyền lợi có giá trị thật.

## Cơ sở từ code hiện tại

- `src/modules/<feature>/{domain,application,infrastructure}` là cấu trúc module hiện tại.
- HTTP nằm ở `src/presentation/http/express/v1`; routes ghép guards, pipes và interceptors; controllers phụ thuộc use-case ports.
- `src/bootstrap/container.ts` và `src/bootstrap/di/http-routes.ts` là manual composition root.
- `src/bootstrap/di/repositories.ts` chọn MongoDB/PostgreSQL adapters. Payment sẽ hỗ trợ cả hai theo cùng contract.
- `IdempotencyInterceptor` hiện tại lưu response và lock trong Redis. Payment cần thêm unique constraint và cập nhật có điều kiện trong database để bảo vệ khi cache hết hạn hoặc callback đến đồng thời.
- `TransformResponseInterceptor` bọc object thường trong response chung. IPN cần trả response trực tiếp theo protocol của provider.
- `env.config.ts` hiện bắt buộc mọi biến trong `ENV_KEYS`; payment được mount ở mọi môi trường nên credentials sandbox và callback base URL trở thành cấu hình bắt buộc khi khởi động. Không cần `PAYMENT_ENABLED`.

GitNexus CLI được dùng vì phiên này không có GitNexus MCP callable. Index local ban đầu chưa có nên đã tạo bằng `analyze --index-only`. Impact của `buildHttpRouters` và `createContainerRepositories`: LOW, mỗi hàm có một direct caller là constructor của Container, không có process được index báo ảnh hưởng. Analyzer cảnh báo thiếu một số cạnh/luồng; kết quả cần được kết hợp với đọc code và tests. Chưa sửa các symbol này.

## Các cách tích hợp

1. **Đề xuất: module payment + adapter bọc thư viện hiện có.** Tận dụng thư viện, giữ nghiệp vụ và HTTP độc lập với SDK. Một payment aggregate lưu snapshot order cố định đủ cho bản đầu.
2. Gọi thư viện trực tiếp trong controller: nhanh để demo nhưng gắn xử lý trạng thái và persistence vào HTTP, lệch cấu trúc hiện tại.
3. Tạo order subsystem đầy đủ hoặc payment microservice: phù hợp khi đã có nghiệp vụ/vòng đời triển khai riêng; hiện chưa có yêu cầu đủ để quyết định các ranh giới này.

## Ranh giới và cấu trúc

```text
src/modules/payment/
  domain/
    entities/payment.entity.ts
    repositories/payment.repository.ts
    repositories/payment.repository.type.ts
  application/
    ports/payment-gateway.port.ts
    use-cases/create-payment/
    use-cases/get-payment/
    use-cases/handle-payment-notification/
  infrastructure/
    gateways/vnpay-payment-gateway.adapter.ts
    gateways/momo-payment-gateway.adapter.ts
    persistence/mongo/
    persistence/postgres/

src/presentation/http/express/v1/
  routes/payment.route.ts
  routes/payment-callback.route.ts
  controllers/payment.controller.ts
  controllers/payment-callback.controller.ts
  dtos/payment/
  pipes/payment.pipe.ts

src/bootstrap/di/payment.ts
src/bootstrap/config/payment.config.ts
```

Domain quản lý invariants và chuyển trạng thái. Application phụ thuộc `PaymentRepositoryPort` và `PaymentGatewayPort`, không import Express, database drivers hay SDK. Hai adapters chuyển dữ liệu provider thành kết quả nội bộ đã xác minh. HTTP chuyển kết quả use case sang response provider hoặc response API. Bootstrap khởi tạo adapters và nối dependencies.

`PaymentGatewayPort` bản đầu có `createCheckout` và `verifyNotification`. Query/refund chưa đưa vào contract cho tới khi thật sự triển khai. Payload ngoài được coi là unknown tại biên adapter; application chỉ nhận thông báo chuẩn hóa có merchant reference, provider, amountVnd, transaction ID và outcome.

## Dữ liệu và trạng thái

Payment gồm: id, userId, sourceType (`order`), sourceReference, description snapshot, amountVnd (số nguyên dương), currency (`VND`), provider, providerOrderId, providerRequestId, status, checkoutUrl, expiresAt, providerTransactionId dạng string, providerResultCode, idempotencyKey, request fingerprint, timestamps, audit fields và version. `expiresAt` được ấn định trước khi gọi VNPay và lưu dạng UTC; adapter chuyển sang GMT+7 `yyyyMMddHHmmss` để gửi `vnp_ExpireDate` bắt buộc. Với MoMo, `expiresAt` có thể null nếu API checkout được dùng không cung cấp hạn dùng được xác nhận.

Migration riêng chuyển các payment cũ có `source_type='example'` sang `order` ở MongoDB và PostgreSQL; giữ nguyên migration khởi tạo đã có thể được áp dụng ở môi trường khác.

Các trạng thái: `creating`, `pending`, `unknown`, `create_failed`, `succeeded`, `failed`, `cancelled`. `create_failed` chỉ dùng khi provider từ chối yêu cầu tạo checkout một cách chắc chắn; `failed` chỉ dùng cho kết quả thanh toán cuối do provider báo qua IPN đã xác minh.

- Lưu `creating` cùng các reference trước khi gọi provider.
- Tạo checkout thành công gắn URL vào bản ghi nếu URL còn null, kể cả khi IPN `pending` đã đến trước response; chỉ đổi `creating` thành `pending`, không ghi đè `pending` hoặc trạng thái cuối do IPN quyết định. Nếu IPN cuối đến sớm, vẫn có thể gắn URL để truy vết nhưng không đổi trạng thái.
- Timeout/lỗi mạng không chứng minh tạo giao dịch thất bại: lưu `unknown` nếu bản ghi vẫn `creating`, giữ nguyên reference, không tự tạo giao dịch mới. URL trả về muộn không được biến trạng thái cuối thành `pending`.
- Lỗi tạo checkout được provider trả về dứt khoát (ví dụ mã lỗi merchant/validation) chuyển `creating` thành `create_failed`; không suy ra điều này từ exception chung của SDK nếu SDK không cung cấp HTTP status/resultCode. Retry cùng idempotency key trả lại cùng bản ghi; lần thử mới cần key mới.
- Chỉ thông báo đã xác minh và đối chiếu đúng bản ghi mới cập nhật kết quả.
- `succeeded` không bị callback cũ/lỗi ghi đè. Thông báo lặp phải so cả provider transaction ID và kết quả đã lưu; cùng outcome nhưng transaction ID khác là mâu thuẫn cần điều tra, không được coi là duplicate hợp lệ. Thông báo `pending` cũ đến sau kết quả cuối là no-op hợp lệ. Không tạo thêm side effect.
- Thông báo mâu thuẫn với kết quả cuối được ghi nhận phục vụ chẩn đoán; không tự đảo trạng thái.
- Thời gian hết hạn checkout chưa đủ chứng minh không nhận tiền; không tự biến payment đang chờ thành thất bại chỉ theo đồng hồ local.

Unique indexes: `(userId, idempotencyKey)`, `(provider, providerOrderId)`, và `(provider, providerTransactionId)` khi transaction ID hợp lệ đã tồn tại. Các sentinel như transaction ID 0 của giao dịch chưa phát sinh không được áp dụng như ID duy nhất toàn cục.

Repository adapters kế thừa `MongoRepositoryBase` và `PostgresRepositoryBase` như các module hiện có. Mapper triển khai `Mapper<PaymentEntity, PaymentModel, PaymentSafeProps>`, hydrate entity từ persistence model, và whitelist response riêng. Repository port của application vẫn hẹp: dùng `PaymentEntity` cùng các thao tác cụ thể như create-or-get theo idempotency và apply verified outcome có điều kiện; không expose các CRUD chung của base repository cho use cases. Mongo dùng `dbCollection`, session của base và atomic conditional update; PostgreSQL dùng `this.query` để tôn trọng transaction context. Đọc trạng thái payment từ primary để tránh hiển thị dữ liệu replica chưa cập nhật ngay sau callback.

Các trường audit (`created_by_id`, `updated_by_id`, `deleted_at`, `deleted_by_id`) cần có trên cả hai model. Thêm forward migration riêng cho PostgreSQL và MongoDB; không sửa migration payment cũ đã có thể được áp dụng ở môi trường khác. Mongo mapper/model mặc định các audit field còn thiếu cho dữ liệu cũ.

Domain types theo convention của các module khác: `PaymentProps` chứa dữ liệu nghiệp vụ, `PaymentFullProps` thêm ID/timestamps/audit để hydrate/serialize entity, `PaymentSafeProps` whitelist dữ liệu được phép trả ra, còn `PaymentCheckoutProps` chỉ chứa snapshot gateway cần. `PaymentEntity` là object đi qua repository và use cases. Quy tắc normalize transaction ID và phân loại callback trùng/mâu thuẫn dùng chung trong payment domain policy để hai persistence adapters không tự định nghĩa khác nhau.

## API và luồng

| API                                           | Mục đích                                                            | Quyền truy cập                              |
| --------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| `POST /api/v1/payments`                       | Tạo payment cho order mẫu, body `{ "provider": "vnpay" }` hoặc momo | JWT, active user; bắt buộc Idempotency-Key  |
| `GET /api/v1/payments/:paymentId`             | Đọc trạng thái được lưu                                             | Chủ payment                                 |
| `GET /api/v1/payments/callbacks/vnpay/ipn`    | Nhận IPN VNPay                                                      | Xác minh chữ ký provider                    |
| `POST /api/v1/payments/callbacks/momo/ipn`    | Nhận IPN MoMo                                                       | Xác minh chữ ký provider                    |
| `GET /api/v1/payments/callbacks/vnpay/return` | Điểm trở về từ VNPay                                                | Chỉ thông báo chung, không cập nhật payment |
| `GET /api/v1/payments/callbacks/momo/return`  | Điểm trở về từ MoMo                                                 | Chỉ thông báo chung, không cập nhật payment |

Create response gồm paymentId, order reference, amountVnd, currency, status và checkoutUrl nếu đã sẵn sàng. Cùng key và payload trả lại cùng payment; key đã dùng với provider khác trả conflict. Payment đang creating/unknown/create_failed được trả trạng thái hiện tại, không gọi create thêm lần nữa. URL quá hạn không được trình bày như checkout còn dùng được; hết hạn theo đồng hồ local không tự kết luận provider đã từ chối thanh toán. Redis có thể tăng tốc nhưng database quyết định tính duy nhất.

Client giữ paymentId trước khi mở checkout. Sau redirect, client đọc GET có JWT để lấy trạng thái thật; return page không công khai chi tiết payment bằng reference nhận từ query. Có thể dùng trang thông báo tối giản và Postman ở bản API đầu tiên.

IPN không dùng JWT user. Adapter xác minh signature và merchant identity, chuẩn hóa provider, order/request reference, amount, transaction ID và mã trạng thái; repository đối chiếu những trường này với bản ghi trước khi cập nhật. VNPay amount nhân/chia 100 chỉ trong adapter. VNPay thành công yêu cầu cả ResponseCode và TransactionStatus là `00`; trạng thái `01` (chưa hoàn tất) giữ `pending`, mã hủy rõ ràng thành `cancelled`, chỉ mã thất bại cuối rõ ràng mới thành `failed`. Mã chưa biết hoặc cần điều tra không được tự coi là thất bại cuối.

MoMo bản đầu dùng thanh toán ví một bước với `requestType='captureWallet'` và `autoCapture=true` được ấn định rõ trong adapter. Theo bảng result code chính thức cho flow này, IPN đã xác minh có `0` hoặc `9000` là `succeeded`; `1000`, `7000`, `7002` là chưa cuối và giữ `pending`. Chỉ mã thất bại cuối đã được tài liệu xác nhận mới thành `failed`/`cancelled`; mã chưa biết giữ trạng thái chưa cuối và ghi nhận để điều tra. Nếu đổi sang flow hai bước (`autoCapture=false`) hoặc phương thức thanh toán khác, phải xem lại bảng trạng thái trước khi dùng `9000`.

VNPay nhận `{ RspCode, Message }` đúng protocol: `00` sau khi ghi bền vững, `02` cho thông báo lặp hợp lệ, `01` khi không tìm thấy order, `04` khi lệch amount, `97` khi chữ ký/merchant không hợp lệ, `99` cho lỗi lưu trữ hoặc mâu thuẫn trạng thái cần điều tra. Không trả `00/02` khi chưa xác nhận được dữ liệu. MoMo nhận HTTP 204 sau khi ghi bền vững hoặc nhận diện lặp hợp lệ; mismatch, chữ ký sai và lỗi database không nhận 204. Callback controller bắt và map lỗi ngay tại route, không để BaseRoute/HttpExceptionFilter bọc response theo API chung. Không log dữ liệu nhạy cảm; ghi sự kiện mâu thuẫn đủ để đối soát.

## Tái sử dụng gateway và ecommerce

Local gateway và bản ecommerce đang cài là `@longdoo/node-payment-gateway` 1.1.2. Khi triển khai cần xác nhận bản registry tương ứng hoặc dùng local package đã pack để kiểm thử; không giả định source local đã được publish.

- Dùng API tạo URL/checkout và verify của thư viện trong adapters.
- `nestjs-ecommerce/src/routes/payment/payment.service.ts` hiện có các xử lý không nên mang nguyên sang: VNPay chỉ kiểm tra chữ ký trước khi cập nhật thành công; MoMo hardcode merchant, xử lý `9000` mà không ràng buộc với cấu hình flow một/hai bước, và parse responseTime sai định dạng.
- VNPay `isSuccess` trong SDK chưa kiểm tra TransactionStatus; adapter cần bổ sung kiểm tra trên payload đã xác minh.
- Khi tạo MoMo, truyền rõ orderId, requestId, extraData để tránh khác biệt giữa defaults được ký và request body của bản thư viện hiện tại.
- SDK VNPay đã nhân 100 khi tạo và chia 100 khi verify; adapter truyền/nhận VND theo contract SDK, không nhân/chia lần thứ hai.
- MoMo create của SDK chưa kiểm tra đầy đủ HTTP status/resultCode/payUrl và chưa có timeout. Trước khi phân biệt từ chối dứt khoát với kết quả chưa rõ, bổ sung hoặc xác nhận một contract trong gateway library trả HTTP status/resultCode có kiểm chứng; nếu SDK chỉ trả exception/URL, exception được xem là `unknown`, không gán `create_failed`. Adapter kiểm tra URL trả về và giới hạn thời gian chờ tối thiểu 30 giây theo yêu cầu MoMo (đề xuất 35 giây); timeout HTTP của route phải dài hơn (đề xuất 45 giây) để lưu trạng thái. `TimeoutInterceptor` hiện dùng Promise.race, không hủy fetch nền; timeout không kích hoạt retry create tự động. AbortSignal nếu cần phải được bổ sung vào thư viện kèm tests.
- API query hiện có hạn chế về typing và xác minh response. Bản đầu dùng IPN để settlement; payment không nhận được IPN sẽ giữ pending/unknown. Đối soát tự động cần công việc riêng và tests về độ tin cậy response.

## Cấu hình sandbox ở mọi môi trường

Payment routes và adapters được mount ở mọi môi trường của ứng dụng, không có `PAYMENT_ENABLED`. Thiếu credentials hoặc callback base URL thì khởi động thất bại với thông báo cấu hình rõ ràng. Cả VNPay và MoMo luôn dùng `testMode:true` và endpoint sandbox, không suy ra mode provider từ `NODE_ENV` hoặc `--env`. Kiểm tra `VNPAY_HOST` là host sandbox để tránh cấu hình nhầm. Không log secret hoặc toàn bộ callback/query chứa dữ liệu nhạy cảm.

Giữ đúng tên các biến merchant đang khai báo trong `nestjs-ecommerce`: `VNPAY_TMN_CODE`, `VNPAY_SECURE_SECRET`, `VNPAY_HOST`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_STORE_ID`, `MOMO_STORE_NAME`. Thêm `PAYMENT_PUBLIC_BASE_URL` cho HTTPS callback URL của `nodejs-social`; URL này phụ thuộc deployment, không sao chép từ ecommerce. Dùng cùng bộ giá trị merchant test đang chạy ecommerce khi cấu hình môi trường triển khai; `.env.example` chỉ chứa placeholders, credentials thực ở env/secret store hoặc file local bị Git ignore.

VNPay cần merchant sandbox credentials và cấu hình IPN URL theo tài khoản merchant. MoMo cần bộ credentials test và gửi ipnUrl khi tạo request. Để IPN từ provider đến máy local, dùng HTTPS public URL/tunnel, giữ tunnel hoạt động suốt bài test.

Thẻ/tài khoản người trả tiền test và merchant credentials là hai loại riêng. VNPay có thẻ NCB mẫu. MoMo hướng dẫn tải app test, tạo ví test và nạp số dư test; không giả định một số điện thoại mẫu bất kỳ có thể dùng với app production.

Nguồn chính thức đã kiểm tra:

- https://sandbox.vnpayment.vn/apis/docs/gioi-thieu/
- https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- https://sandbox.vnpayment.vn/devreg/
- https://developers.momo.vn/v3/docs/payment/onboarding/integration-process/
- https://developers.momo.vn/v3/vi/docs/payment/onboarding/test-instructions/
- https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/notification/
- https://developers.momo.vn/v3/docs/payment/api/result-handling/resultcode/
- https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime/

## Các mốc triển khai đề xuất

1. Payment entity, use-case ports, state rules và repository contract; tests cho amount, ownership, duplicate và state transition.
2. Persistence Mongo/Postgres và migrations; integration tests cho unique indexes, concurrent callbacks và conditional writes.
3. Lát cắt VNPay hoàn chỉnh: tạo order payment → checkout → IPN → GET status; test protocol/raw response và return không settlement.
4. Lát cắt MoMo theo cùng contract; kiểm tra payload ký, timestamp milliseconds, duplicate, mã `0/9000` cho flow một bước và các mã chưa cuối.
5. Cấu hình sandbox bắt buộc, DI, Swagger/Postman, hướng dẫn tunnel và thao tác sandbox. Chạy typecheck, lint, tests liên quan và build; kiểm tra kiến trúc theo test harness hiện có.
6. Smoke test thật với từng sandbox: tạo payment, thanh toán mẫu, IPN đến server, database thành succeeded, GET trả đúng. Kiểm tra thêm hủy/thất bại và callback lặp.

Trước mỗi sửa đổi symbol cũ chạy GitNexus impact và báo HIGH/CRITICAL nếu có; sau thay đổi chạy detect_changes và kiểm tra callers trực tiếp. Các mốc trên là roadmap đã được dùng để triển khai; chi tiết thay đổi convention hiện được ghi ở implementation plan.

## Tiêu chí hoàn thành

- Hai provider tạo được checkout thật trên sandbox và callback cập nhật đúng database.
- Sai chữ ký/số tiền/merchant/provider không thể ghi nhận thành công.
- Callback lặp/đồng thời không tạo hai lần kết quả; callback `pending` đến sớm vẫn cho phép gắn checkout URL, còn callback cuối không bị create response ghi đè.
- Return URL không thay đổi trạng thái; user khác không đọc được payment.
- Retry API không tự tạo thêm payment/giao dịch khi kết quả lần trước chưa rõ.
- Payment hoạt động ở mọi môi trường ứng dụng nhưng chỉ kết nối sandbox; cả hai persistence adapters tuân thủ cùng behavior. Không có đường cấu hình nào âm thầm chuyển sang thu tiền thật.
- Test tự động dùng fake gateway/fixture có chữ ký và database phù hợp; smoke test thật được báo riêng với bằng chứng thực tế. Nếu chưa có credentials hoặc chưa hoàn thành thao tác trên app test, chỉ báo phần đã xác minh, không gọi đó là sandbox end-to-end đã pass.
