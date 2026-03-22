# Phase 5 — Research (Notifications inbox)

**Date:** 2026-03-23  
**Scope:** Hỗ trợ `gsd-plan-phase`; không thay thế `05-CONTEXT.md`.

## Kiến trúc hiện có

- **Social DB (`DatabaseService.db`):** friends, blocks, users — notification **phải** nằm đây (NOTF-01), không dùng `chatDb`.
- **`DatabaseService`:** thêm getter `notifications` → `this.db.collection<INotification>('notifications')` và method `createNotificationIndexes()` gọi từ `initializeIndexes()` (cùng pattern `createFriendRequestIndexes`).
- **`BlockRepository.listUserIdsBlockedInEitherDirection(viewerId)`:** dùng cho filter list inbox (D-14) — ẩn item nếu `actor.userId` (ObjectId) nằm trong tập blocked.
- **`FriendsService`:** `sendFriendRequest` / `acceptIncomingRequest` — sau khi write DB thành công, gọi `NotificationsService` (block đã chặn trước đó → không tới nhánh notify).
- **`ChatMessagesService.sendMessage`:** sau `insertMessage` + `touchUpdatedAt` — tạo notify cho peer (direct) hoặc mọi member trừ sender (group); mỗi recipient: bỏ qua nếu `isBlockedEitherWay(recipient, sender)` (D-13).
- **`ChatsService.inviteMember`:** sau `insertMember` — một notify `added_to_group` cho **invitee** (`body.userId`), actor = inviter snapshot.
- **`SocketService`:** `Map<userId, socketId>`; cần **public** API kiểu `emitToUser(userId, 'notification:new', payload)` — chỉ emit nếu online; NOTF-03 **sau** persist trong `NotificationsService`.

## Quyết định kỹ thuật đề xuất

| Chủ đề | Đề xuất |
|--------|---------|
| Collection | `notifications` trên social DB |
| Cursor list | Base64url JSON `{ t: createdAt.getTime(), i: _id.hex }` — reuse style `encodeMessageCursor` / thêm `encodeNotificationCursor` trong `src/utils/` hoặc file cursor chung |
| Query | `GET ...?limit=&cursor=&unreadOnly=true` — default: tất cả, sort `createdAt` desc, `_id` desc |
| Retention | `N = 1000` / user (D-11); sau mỗi insert cho `recipientId`, trim: xóa bản ghi **cũ nhất**, ưu tiên `read: true` trước (sort `read` ascending then `createdAt` ascending cho lựa chọn nạn nhân xóa) |
| Mark read | `PATCH /notifications/read` body `{ ids?: string[] }` — thiếu/`ids: []` = mark all; `PATCH /notifications/:id/read` cho một id |
| Payload strict | Discriminated union theo `type`; OpenAPI `oneOf` hoặc fragment theo type |
| Socket event | `notification:new` — payload gọn khớp item list API (hoặc `{ notification: <same shape> }`) |

## Rủi ro

- **Phase 6:** room theo `userId` chưa join tự động — hiện tại map `userId → socket` đủ cho emit cá nhân nếu client đã connect; document trong plan: client vẫn dùng REST là source of truth.
- **Trùng DI:** `NotificationsService` cần `IUserRepository` (snapshot), `BlockRepository`, `DatabaseService`/repo, `SocketService` — tránh vòng lặp (Socket không import Notifications).

## Validation Architecture

Phase 7 mới có Vitest đầy đủ (QUAL-02). Phase 5:

- **Automated gate:** `npm run build` sau mỗi task có chỉnh TypeScript.
- **Manual UAT:** list + cursor + unread filter; mark single/batch/all; tạo friend request → notify + socket; accept → notify; gửi tin (text + chỉ ảnh) → copy preview đúng D-06; invite group → `added_to_group`; block hai chiều → không tạo notify mới từ luồng đó; list ẩn notify có actor blocked.

---

## RESEARCH COMPLETE
