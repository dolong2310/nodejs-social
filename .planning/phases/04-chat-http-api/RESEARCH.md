# Phase 4 — Research notes (Chat HTTP + block read redaction)

**Date:** 2026-03-22  
**Scope:** Hỗ trợ `gsd-plan-phase`; không thay thế `04-CONTEXT.md`.

## Kiến trúc hiện có

- **`DatabaseService`:** `this.db` (social) + `chatDb` (chat), cùng `MongoClient`. `initializeIndexes()` chỉ tạo index trên **social**; Phase 4 cần **`initializeChatIndexes()`** (hoặc tương đương) cho collection trên `chatDb`.
- **Luồng thử nghiệm:** `conversations` collection trên **social** (`IConversation` sender/receiver/content/lastMessage). Phase 4 **thay** bằng model mới trên **chat DB**; gỡ index `createConversationsIndex` + getter social `conversations` sau khi migrate code (tránh giữ hai nguồn sự thật).
- **Block:** `BlockRepository.isBlockedEitherWay`, `listUserIdsBlockedInEitherDirection` — tái dùng cho guard chat và cho layer redaction read path.
- **Engagement (để biết “đã tương tác”):** `likes` (`userId`, `postId`), `bookmarks` (`userId`, `postId`), `posts` với `parentId` + `userId` cho **comment**. Repost/quote: kiểm tra `posts` type nếu đã có trong ENGA — planner nên gộp một helper `hasUserEngagedWithAuthorsPost(viewerId, authorId)` hoặc per-post `hasEngagementOnPost(viewerId, postId)`.

## Quyết định kỹ thuật gợi ý (executor có thể điều chỉnh)

- **Tên collection chat DB:** dùng prefix rõ ràng, ví dụ `chats`, `chatMembers`, `messages` — tránh tên `conversations` trên chat DB nếu dễ nhầm với collection cũ trên social (hoặc dùng `conversations` trên chat DB **sau khi** xóa hẳn collection social — document trong plan).
- **Direct unique:** unique index trên cặp `(userIdLow, userIdHigh)` trong subdoc hoặc bảng mapping `directChats` — hoặc field `participantPairKey` deterministic string.
- **Cursor messages:** `(createdAt desc, _id desc)` với cursor opaque base64 hoặc `createdAt+id` — theo pattern đã có ở pagination project nếu có.
- **Attachment:** reuse presigned / upload flow từ `media` + `s3.service`; thêm validation **5MB/file** trước khi accept (middleware hoặc service).

## Rủi ro

- **D-11 vs feed hiện tại:** feed đang loại toàn bộ post của author nằm trong `blockedAuthorIds`. Cần đổi thành: loại trừ trừ khi viewer có **engagement** trên **post đó** (postId-level), khi đó vẫn trả post nhưng **author redacted**.
- **Socket (Phase 6):** HTTP path phải persist trước; CONCERNS — không scope Phase 4 nhưng message service nên là nguồn dùng lại cho socket sau này.
