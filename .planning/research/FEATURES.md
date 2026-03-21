# Feature Research

**Domain:** Brownfield backend for social graph, posts/feed, realtime chat, and notifications (TypeScript/Express/Mongo)
**Researched:** 2026-03-21
**Confidence:** HIGH (requirements sourced from `.planning/PROJECT.md`; market norms MEDIUM)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a “friends + feed + chat” product. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Two-way friendship | Request → accept/decline/revoke; list friends; replaces one-way follow for trust + chat gating | MEDIUM | Drop legacy followers data (no migration); rate-limit ~100 outgoing requests/user/day (anti-spam) |
| Unfriend | Users must be able to end relationships without blocking | LOW | Updates graph + derived visibility/chat eligibility |
| Block (v1) | Safety and control over who can interact | MEDIUM | Block ⇒ mutual invisibility of posts (including `public`) + auto-unfriend; APIs must be consistent everywhere (feed, fetch by id, search surfaces) |
| Post visibility | `public` \| `friends-only` \| `only-me` | MEDIUM | Enforce on read paths + write; default new post `public` per product decision |
| Stranger comment policy | Public posts often allow discussion; private graph expects tighter control | MEDIUM | Default: allow stranger comments on new posts; enforce: strangers comment only if post is `public` **and** flag true; strangers may still like/bookmark when post is viewable |
| Core engagement | Like, comment, bookmark on posts | LOW–MEDIUM | Complexity in permission matrix (visibility + block + stranger rules), not raw CRUD |
| Merged chronological feed | Single timeline mixing global public content + friends’ eligible posts | HIGH | Query/index design across visibility + block + friend set; **no ranking** in v1 |
| Direct messages | 1:1 chat between friends | HIGH | New chat DB (`DATABASE_CHAT_NAME`); replace experimental `/api/conversations`; no DM before friendship |
| Group chat | Multi-participant rooms; **2-person groups allowed** | HIGH | Membership, invites/adds, permissions; aligns with `added_to_group` notifications |
| Message history & delivery basics | Scrollable history, read/delivered-style signals as designed | MEDIUM–HIGH | Socket.IO rooms + persistence; **do not trust `senderId` from client** (CONCERNS) |
| Notification inbox | Durable notifications users can open later | MEDIUM | DB + REST list + mark read (minimal v1 surface) |
| Realtime notification delivery | Toast/badge parity with server state | MEDIUM | Emit on create to per-user Socket.IO room |
| Core notification types | Covers graph + messaging flows | LOW–MEDIUM | `friend_request`, `friend_accepted`, `new_message`, `added_to_group`; schema extensible for future types |
| Media for posts & chat | Uploads for attachments/avatars | MEDIUM | S3 per stack; reuse project auth patterns |

### Differentiators (Competitive Advantage)

Features that are not universal but align with **Core Value** (trusted friends, correct permissions, stable chat + notifications) and stated decisions.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Notifications: DB + REST + socket | Inbox is source of truth; mobile/web can sync; better than socket-only | MEDIUM | Distinct from reference PingMe-style “mostly socket” |
| Chat bounded context, separate Mongo DB | Operational separation without second HTTP service | HIGH | Same cluster, `DATABASE_CHAT_NAME`; keeps `/api/...` surface unified (no `/api/chat` prefix) |
| Strict “friends-only chat” | Reduces spam/abuse vs open DMs | LOW (policy) | Explicit product rule; no extra “stranger message” setting |
| Block hides all mutual posts (even public) | Strong, predictable privacy | MEDIUM | Must be applied consistently or trust erodes |
| Per-post stranger comment toggle | Fine-grained control without killing public reach | LOW–MEDIUM | Default permissive UX; power users tighten per post |
| Extensible notification types | Forward-compatible product events | LOW | v1 ships minimal enum set; avoid hardcoding-only clients |

### Anti-Features (Explicit NOT Build / Defer)

Features commonly asked for but **out of v1** per PROJECT.md or as scope traps.

| Feature | Why Requested | Why Problematic / Deferred | Alternative |
|---------|---------------|----------------------------|-------------|
| Moderation / report (user, post, comment) | Safety teams expect tooling | Not v1; adds workflows, queues, admin roles | Defer to post-v1; rely on block/unfriend meanwhile |
| Feed ranking / recommendation | “Make feed engaging” | Algorithm + infra + feedback loops; contradicts v1 chronological spec | v1: `createdAt` desc merged feed only |
| Legacy API/FE compatibility (e.g. PingMe) | Faster client migration | Locks bad contracts; project explicitly rejects | New FE contracts; reference repo behavior-only |
| Separate chat microservice or port | Scale isolation | Violates single-process constraint | Code module + separate DB |
| Mongoose for chat | Familiar ODM | Out of stack decision | Native driver as rest of app |
| Cloudinary for chat media | Quick uploads | Out of stack decision | S3 |
| “Block messages from strangers” setting | Extra privacy knob | Redundant with “no DM without friendship” | Omit setting |
| DM requests / inbox for non-friends | Growth / outreach | Opens abuse; conflicts with no-stranger-DM | Keep hard gate: friendship required |

## Feature Dependencies

```
[Auth session / user identity]
    └──requires──> [User profile]
                           └──requires──> [Friend graph: request/accept/decline/revoke/list]
                                    ├──requires──> [Block/Unfriend + graph consistency]
                                    ├──requires──> [Friend request rate limit]
                                    ├──requires──> [Notifications: friend_request, friend_accepted]
                                    ├──requires──> [Direct chat eligibility]
                                    │                    └──requires──> [Chat DB + conversations/messages]
                                    │                             └──requires──> [Socket.IO chat rooms + server-trusted sender]
                                    │                                      └──requires──> [Notifications: new_message]
                                    └──requires──> [Group chat]
                                             └──requires──> [Membership model + invites/adds]
                                                      └──requires──> [Notifications: added_to_group]

[Post CRUD]
    └──requires──> [Post visibility: public | friends-only | only-me]
             └──requires──> [Stranger comment flag + enforcement]
                      └──requires──> [Merged feed query]
                               └──requires──> [Friend graph + block rules applied on read]

[Comment / like / bookmark]
    └──requires──> [Resolved post visibility for viewer]
             └──requires──> [Stranger rules for comment vs like/bookmark]

[Notification inbox REST]
    └──requires──> [Typed notification records + extensibility]
             └──enhances──> [Socket emit on create]
```

### Dependency Notes

- **Chat requires friendship:** Product rule; graph state must be authoritative before conversation create/send.
- **Merged feed requires friends + visibility + block:** Feed is the highest-integration surface; partial implementation leaks private content.
- **Group chat requires membership + notifications:** Adds/removes must generate `added_to_group` (and likely future types).
- **Socket chat requires trusted server identity:** Client-supplied sender is unsafe; persist then emit (CONCERNS).
- **Block enhances unfriend:** Auto-unfriend on block avoids inconsistent “friends but blocked” states.

## MVP Definition

### Launch With (v1)

Minimum to validate “trusted friends, correct feed permissions, chat + notifications.”

- [ ] **Friend graph** replacing followers (request/accept/decline/revoke, list) + daily send cap — essential for trust + chat gate
- [ ] **Unfriend + block** (mutual post hide, auto-unfriend) — safety baseline
- [ ] **Post visibility + stranger-comment flag** with enforcement — core permission model
- [ ] **Merged chronological feed** (public + friends-only visibility rules + block) — primary consumption surface
- [ ] **Comments/likes/bookmarks** under the permission matrix — table stakes engagement
- [ ] **Direct + group chat** on `DATABASE_CHAT_NAME`, replacing experimental conversations + Socket.IO chat — core value
- [ ] **Notifications** DB + REST + socket; types `friend_request`, `friend_accepted`, `new_message`, `added_to_group`; extensible schema — inbox + realtime
- [ ] **CONCERNS remediation** on chat/notification paths (trusted sender, persist-before-emit, participant checks) — prevents incident-driven rewrite

### Add After Validation (v1.x)

Once core loops stable and metrics exist.

- [ ] **Richer notification types** (e.g. comment, mention, reaction) — trigger: client ready + event taxonomy
- [ ] **Search/discovery adjustments** for friend-only content — trigger: UX needs blocked-stranger clarity
- [ ] **Test runner + CI** (PROJECT.md: not in `package.json` yet) — trigger: before scaling team velocity

### Future Consideration (v2+)

Explicit deferrals.

- [ ] **Moderation & reporting** — legal/ops overhead; after v1 safety primitives proven
- [ ] **Ranked / personalized feed** — needs data pipeline + policy
- [ ] **Optional** public profile / creator modes beyond current visibility enum — only if product pivots

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Friend graph + rate limit | HIGH | MEDIUM | P1 |
| Block + unfriend | HIGH | MEDIUM | P1 |
| Post visibility + stranger comments | HIGH | MEDIUM | P1 |
| Merged feed (chronological) | HIGH | HIGH | P1 |
| Chat (DM + group) + chat DB | HIGH | HIGH | P1 |
| Replace Socket.IO + conversations experiment | HIGH | HIGH | P1 |
| Notifications DB + REST + socket + core types | HIGH | MEDIUM | P1 |
| Like/comment/bookmark under rules | HIGH | MEDIUM | P1 |
| S3 media for chat | MEDIUM | MEDIUM | P1 |
| Extensible notification typing | MEDIUM | LOW | P2 |
| Automated test suite | MEDIUM | MEDIUM | P2 |
| Feed ranking | MEDIUM | HIGH | P3 |
| Moderation/reporting | MEDIUM | HIGH | P3 |

**Priority key:**

- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Typical consumer social | Typical messaging app | Our Approach |
|---------|-------------------------|------------------------|--------------|
| Relationship model | Follow or subscribe | Often phone/SMS graph | Mutual friends only; no followers in v1 |
| DMs | Often open or request-based | Core | Friends-only; no stranger inbox |
| Feed | Ranked for engagement | N/A (no feed) | Chronological merged public + friends |
| Notifications | In-app + push | In-app + push | DB + REST + socket (persistent inbox) |
| Safety | Report + block | Block | Block + unfriend v1; report deferred |

## Sources

- `.planning/PROJECT.md` (requirements, out of scope, key decisions) — **HIGH**
- `.planning/codebase/CONCERNS.md` (referenced for chat safety constraints) — **HIGH**
- Industry norms for social/chat products — **MEDIUM** (generic patterns, not a single competitor study)

---
*Feature research for: nodejs-social (friends + feed + chat + notifications v1)*
*Researched: 2026-03-21*
