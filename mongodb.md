123.21.248.46

soosoo_admin / Qt80qzZ8yR8hVcn7

# Kết nối MongoDB

- dùng Mongo Compass
- dùng MongoSH (terminal)
- dùng mongo driver (SDK tích hợp vào code)
- dùng extension MongoDB cho VS Code

# Cấp độ tổ chức trong MongoDB (Mongo Atlas)

- Organizations (cao nhất)
- Projects
- Cluster **Có thể hiểu là 1 server vps, dùng để cài đặt mongodb. Thế nên có thể tạo nhiều database trên server đó**
- Database
- Collection
- Document
- Field

# Tài liệu CRUD trong mongo:

- link: `https://www.mongodb.com/docs/manual/crud/`

# Thiết kế database (theo chuẩn no-sql MongoDB)

- Các yếu tố ảnh hưởng đến schema:

1. Ứng dụng đọc hay ghi nhiều
2. Dữ liệu nào thường được truy cập cùng nhau
3. Các yếu tố về hiệu suất
4. Dữ liệu sẽ tăng và mở rộng như thế nào

- Thiết kế theo chuẩn SQL thì sẽ chia ra các bảng, bảng chính và bảng phụ được liên kết với nhau bằng `khoá chính` và `khoá ngoại`, dùng `JOIN` để truy cập cùng nhau.
- Thiết kế theo chuẩn No-SQL thì gom tất cả thành 1 document, document là 1 dạng `JSON` có key-value, khi truy cập chỉ cần `find` document, không cần `JOIN`.

## Nhúng (Embbeding) và tham chiếu (Referencing)

- `Nhúng` là đưa hết dữ liệu vào 1 object hoặc 1 mảng trong document.
- Nhược điểm lớn nhất là giới hạn về dung lượng của document `16 MB`, nếu nhúng 1 array rất nhiều phần tử sẽ chạm đến giới hạn. Ngoài ra, có thể bị trùng lặp dữ liệu giữa các document.
- `Tham chiếu` là tách dữ liệu ra bảng phụ, sau đó dùng `khoá chính` và `khoá ngoại` để trỏ tới. (trong mongo, để tham chiếu dùng toán tử `$lookup` tương tự `JOIN`).
- Ưu điểm, vì tách ra bảng phụ nên có thể tái sử dụng, chia sẻ dữ liệu giữa các bảng nếu có relationship.
- Nhược điểm, tốn 2+n query hoặc dùng toán tử `$lookup`.

## Quy tắc thiết kế

1. Ưu tiên nhúng, trừ khi có lý do thuyết phục để không nhúng.
2. Khi cần truy cập 1 đối tượng riêng biệt, không nên dùng nhúng.
3. Tránh `JOIN` hoặc `$lookup` nếu có thể, nhưng nếu thiết kế 1 schema tốt thì vẫn có thể `JOIN` hoặc `$lookup`.
4. Array không nên phát triển không giới hạn. Nếu có `nhiều document` ở phía `nhiều` thì đừng `nhúng`. Nếu có `rất nhiều document` ở phía `nhiều` thì đừng dùng `nhúng` kết hợp `tham chiếu` (array ObjectId) ==> Mảng với `rất nhiều` item là lý do không nên dùng `nhúng`.
5. Trong MongoDB, cách mô hình hoá dữ liệu phụ thuộc vào cách sử dụng dữ liệu. Cấu trúc dữ liệu phải phù hợp với cách mà ứng dụng query và update nó.

## Relationship

### 1 - 1

- chỉ có 1 key-value
- ví dụ:

```
"user": { "name": "a", "age": 18 }
```

### 1 - ít

- có thể chỉ cần key-value, nên chỉ cần nhúng vào document
- ví dụ: thông tin user có số điện thoại nhà, công việc, cá nhân => nhúng vào document { home_number: 123, work_number: 456, personal_number: 789 }
- ưu tiên `nhúng` cho `1 - ít`
- ví dụ:

```
users: [
  { "_id": ObjectId(AAA), "name": "a" },
  { "_id": ObjectId(BBB), "name": "b" }
]
```

### 1 - nhiều

- vì 1 document có thể chứa nhiều document khác, dẫn đến việc chạm giới hạn dung lượng nên cần phải tách ra `bảng` phụ
- ưu tiên kết hợp `nhúng` và `tham chiếu` cho `1 - nhiều`
- ví dụ:

```
users: [ObjectId(AAA), ObjectId(BBB), ObjectId(CCC)]
```

### 1 - rất nhiều

- vì 1 document có thể chứa `RẤT NHIỀU` document khác, dẫn đến việc chạm giới hạn dung lượng nên cần phải tách ra nhiều `document` phụ
- ưu tiên `tham chiếu` cho `1 - nhiều`
- ví dụ:

```
users: [
  { _id: ObjectId(AAA), "name": "a", "age": 18 }
]
```

và rất nhiều document phụ

```
logMessages: [
  { "user_id": ObjectId(AAA), "message": "example message 111" },
  { "user_id": ObjectId(AAA), "message": "example message 222" }
]
```

### nhiều - nhiều

- vì nhiều document có thể chứa nhiều document, nên có thể kết hợp `nhúng` và `tham chiếu` (array ObjectId)
- ví dụ:

```
users: [
  {
    "_id": ObjectId(AAA),
    "name": "a",
    "tasks": [ObjectId(aaa), ObjectId(bbb), ObjectId(ccc)]
  },
  {
    "_id": ObjectId(BBB),
    "name": "b",
    "tasks": [ObjectId(aaa), ObjectId(bbb), ObjectId(ccc)]
  },
]
```

và 1 collection khác

```
tasks: [
  {
    "_id": ObjectId(aaa),
    "name": "task aaa",
    "users: [ObjectId(AAA), ObjectId(BBB), ObjectId(CCC)]
  },
  {
    "_id": ObjectId(bbb),
    "name": "task bbb",
    "users: [ObjectId(AAA), ObjectId(BBB), ObjectId(CCC)]
  },
]
```
