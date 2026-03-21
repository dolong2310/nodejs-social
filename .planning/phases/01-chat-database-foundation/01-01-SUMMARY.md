---
phase: 01-chat-database-foundation
plan: "01"
subsystem: database
tags: [mongodb, env, dual-db]

requires: []
provides:
  - Biến môi trường bắt buộc DATABASE_CHAT_NAME
  - Hai handle Db (social + chat) trên một MongoClient, ping kép và fail-fast
  - Getter chatDb trên DatabaseService / IDatabaseService
affects:
  - Phase 4 (chat HTTP) sẽ dùng chatDb

tech-stack:
  added: []
  patterns:
    - "Một URI cluster, hai tên database; không tách client cho Phase 1"

key-files:
  created: []
  modified:
    - src/config/envConfig.ts
    - .env.example
    - src/database/mongodb/database.service.ts
    - src/database/mongodb/index.ts
    - src/types/app.type.ts
    - src/index.ts
    - scripts/fake-data.ts

key-decisions:
  - "Chat DB lỗi ⇒ đóng client và throw; không chạy social-only"
  - "Không tạo index/collection chat trong Phase 1"

patterns-established:
  - "Truy cập chat qua databaseService.chatDb cho phase sau"

requirements-completed: [INFR-01, INFR-03]

duration: 15min
completed: 2026-03-21
---

# Phase 1: Tóm tắt plan 01-01

**Ứng dụng bắt buộc cấu hình tên DB chat, mở hai database trên cùng cluster, ping cả hai khi khởi động và ghi log tên DB; ví dụ env có `DATABASE_CHAT_NAME`.**

## Performance

- **Tasks:** 3 (env + service + bootstrap/script)
- **Files modified:** 7 (theo plan; `.env.development` chỉ local, gitignored)

## Accomplishments

- `ENV_KEYS` có `DATABASE_CHAT_NAME`; thiếu biến ⇒ crash khi load config như các key khác.
- `DatabaseService` nhận `chatDatabaseName`, `_chatDb`, `connect()` ping social rồi chat, log `connected to mongodb databases` kèm tên hai DB.
- `AppConfig`, `DatabaseInstance.init`, `createApp` bootstrap và `fake-data.ts` truyền đủ `chatDatabaseName`.

## Verification

- `npm run build` — exit 0
- `rg DATABASE_CHAT_NAME` trên `envConfig.ts`, `index.ts`, `fake-data.ts` — có khớp

## Ghi chú vận hành

- Thêm `DATABASE_CHAT_NAME` vào mọi file `.env.<mode>` local (không commit); `.env.example` đã có mẫu.
