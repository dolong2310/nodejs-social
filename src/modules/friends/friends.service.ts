/**
 * Friend-request **daily send cap** (FRND-05 / D-07) uses the **UTC calendar day**
 * (`Date.UTC` year/month/day at midnight, window length 86400000 ms), not the server's
 * local timezone and not per-user local timezones.
 */

import { CACHE_KEYS, CACHE_TTL, VALIDATION_ERROR_MESSAGE } from '@/constants';
import { AutoBind } from '@/decorators';
import type { IFriendshipRepository } from '@/modules';
import {
  BaseService,
  BlockRepository,
  FriendRequestRepository,
  IFriendRequest,
  INotificationsService,
  IUser,
  IUserRepository
} from '@/modules';
import {
  BadRequestError,
  ConflictRequestError,
  ForbiddenError,
  IRedisService,
  NotFoundError,
  TooManyRequestsError
} from '@/providers';
import {
  decodeFriendListCursor,
  decodeFriendRequestCursor,
  encodeFriendListCursor,
  encodeFriendRequestCursor
} from '@/utils';
import { MongoServerError } from 'mongodb';

/** User fields returned in friend / pending-request lists. */
export interface FriendUserRow {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface IFriendsService {
  findFriendUserIds(userId: string): Promise<string[]>;
  isFriendOf(viewerUserId: string, otherUserId: string): Promise<boolean>;
  /** True iff every id in `otherUserIds` is an accepted friend of `viewerUserId` (single DB round-trip). */
  areAllFriends(viewerUserId: string, otherUserIds: string[]): Promise<boolean>;
  invalidateFriendCache(userId: string): Promise<void>;
  sendFriendRequest(myUserId: string, toUserId: string): Promise<IFriendRequest>;
  acceptIncomingRequest(myUserId: string, fromUserId: string): Promise<void>;
  declineIncomingRequest(myUserId: string, fromUserId: string): Promise<void>;
  revokeOutgoingRequest(myUserId: string, toUserId: string): Promise<void>;
  unfriend(myUserId: string, otherUserId: string): Promise<void>;
  listFriends(
    myUserId: string,
    limit: number,
    cursor?: string
  ): Promise<{ users: FriendUserRow[]; nextCursor: string | null }>;
  listIncomingRequests(
    myUserId: string,
    limit: number,
    cursor?: string
  ): Promise<{ users: FriendUserRow[]; nextCursor: string | null }>;
  listOutgoingRequests(
    myUserId: string,
    limit: number,
    cursor?: string
  ): Promise<{ users: FriendUserRow[]; nextCursor: string | null }>;
}

export class FriendsService extends BaseService implements IFriendsService {
  private static readonly OUTGOING_REQUESTS_PER_UTC_DAY = 100;

  constructor(
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly friendRequestRepository: FriendRequestRepository,
    private readonly blockRepository: BlockRepository,
    private readonly redisService: IRedisService,
    private readonly userRepository: IUserRepository,
    private readonly notificationsService: INotificationsService
  ) {
    super();
  }

  private utcDayRange(now: Date): { start: Date; endExclusive: Date } {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const start = new Date(Date.UTC(y, m, d));
    const endExclusive = new Date(start.getTime() + 86400000);
    return { start, endExclusive };
  }

  private toFriendUserRow(user: IUser): FriendUserRow {
    return {
      _id: user._id.toHexString(),
      name: user.name,
      username: user.username,
      avatar: user.avatar
    };
  }

  /**
   * Vì hệ thống có cache danh sách bạn bè theo user (Redis key CACHE_KEYS.friends(userId)), dùng ở findFriendUserIds().
   * Khi decline/revoke/unfriend thì graph bạn bè / trạng thái liên quan thay đổi, nên cần xóa cache của cả hai người để các API khác (list friends, check mutual, permissions “friends-only”, mở direct conversation, …) không bị đọc dữ liệu cũ.
   */
  private async invalidateBoth(userIdA: string, userIdB: string): Promise<void> {
    await Promise.all([this.invalidateFriendCache(userIdA), this.invalidateFriendCache(userIdB)]);
  }

  @AutoBind
  async findFriendUserIds(userId: string): Promise<string[]> {
    const cached = await this.redisService.get<string[]>(CACHE_KEYS.friends(userId));
    if (cached !== null) {
      return cached;
    }

    const friendIds = await this.friendshipRepository.findFriendUserIdsForUser(userId);
    await this.redisService.set(CACHE_KEYS.friends(userId), friendIds, CACHE_TTL.FRIENDS_GRAPH);

    return friendIds;
  }

  async isFriendOf(viewerUserId: string, otherUserId: string): Promise<boolean> {
    const pair = await this.friendshipRepository.findFriendshipPair(viewerUserId, otherUserId);
    return pair !== null;
  }

  /**
   * Lấy tất cả số lượng member trong group là bạn bè của admin và so sánh với số lượng member trong group (trừ admin ra) phải bằng nhau.
   */
  async areAllFriends(viewerUserId: string, otherUserIds: string[]): Promise<boolean> {
    if (otherUserIds.length === 0) {
      return true;
    }
    const number = await this.friendshipRepository.countFriendshipsWithUserAmongOthers(viewerUserId, otherUserIds);
    return number === otherUserIds.length;
  }

  async invalidateFriendCache(userId: string): Promise<void> {
    await this.redisService.del(CACHE_KEYS.friends(userId));
  }

  /**
   * Gửi yêu cầu kết bạn
   * - Không cho gửi yêu cầu kết bạn tới chính mình.
   * - Kiểm tra xem người được gửi yêu cầu có tồn tại không.
   * - Kiểm tra xem người được gửi yêu cầu có block người gửi không.
   * - Kiểm tra xem người được gửi yêu cầu có là bạn bè với người gửi không.
   * - Kiểm tra xem người được gửi yêu cầu có đã gửi yêu cầu kết bạn tới người gửi không.
   * - Kiểm tra xem người được gửi yêu cầu có đã gửi yêu cầu kết bạn tới người gửi không.
   */
  async sendFriendRequest(myUserId: string, toUserId: string): Promise<IFriendRequest> {
    if (myUserId === toUserId) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CANNOT_SEND_FRIEND_REQUEST_TO_YOURSELF);
    }

    // kiểm tra xem người được gửi yêu cầu có tồn tại không
    const target = await this.userRepository.findById(toUserId);
    if (!target) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const { start, endExclusive } = this.utcDayRange(new Date());
    const [isBlockedEitherWay, existingFriendship, sentToday] = await Promise.all([
      this.blockRepository.isBlockedEitherWay(myUserId, toUserId),
      this.friendshipRepository.findFriendshipPair(myUserId, toUserId),
      this.friendRequestRepository.countOutgoingRequestsCreatedOnUtcDay(myUserId, start, endExclusive)
    ]);

    // kiểm tra xem người được gửi yêu cầu có block người gửi không
    if (isBlockedEitherWay) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.FRIEND_ACTION_BLOCKED);
    }

    // kiểm tra xem người được gửi yêu cầu có là bạn bè với người gửi không
    if (existingFriendship) {
      throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.ALREADY_FRIENDS);
    }

    // kiểm tra xem người gửi có vượt quá số lượng yêu cầu kết bạn tới người được gửi yêu cầu không
    // Vì 1 ngày chỉ được gửi 100 yêu cầu kết bạn tới người được gửi yêu cầu không => tránh spam
    if (sentToday >= FriendsService.OUTGOING_REQUESTS_PER_UTC_DAY) {
      throw new TooManyRequestsError(VALIDATION_ERROR_MESSAGE.FRIEND_REQUEST_DAILY_LIMIT_EXCEEDED);
    }

    // try/catch để bắt lỗi Mongo duplicate key 11000 (thường do unique index theo cặp directed fromUserId+toUserId)
    // -> map sang lỗi nghiệp vụ FRIEND_REQUEST_ALREADY_PENDING (409).
    // - nếu đang có request B->A pending, hệ thống vẫn cho phép A gửi A->B (tạo 2 request ngược chiều cùng lúc).
    // - DB chỉ chống trùng cùng chiều (A->B) chứ không chống "ngược chiều".
    // - đây là lựa chọn nghiệp vụ (có hệ thống sẽ tự chuyển thành "accept" hoặc chặn, nhưng ở đây thì không).
    try {
      const created = await this.friendRequestRepository.insertPendingRequest(myUserId, toUserId);
      // invalidate cache của người gửi
      await this.invalidateFriendCache(myUserId);
      // notification "friend request" cho người nhận
      await this.notificationsService.recordFriendRequest(toUserId, myUserId);
      return created;
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.FRIEND_REQUEST_ALREADY_PENDING);
      }
      throw e;
    }
  }

  async acceptIncomingRequest(myUserId: string, fromUserId: string): Promise<void> {
    // kiểm tra xem người nhận có yêu cầu kết bạn tới người gửi không
    const pending = await this.friendRequestRepository.findPendingByDirectedPair(fromUserId, myUserId);
    if (!pending) {
      // kiểm tra xem người gửi và người nhận đã là bạn bè không
      // Mục tiêu: xử lý case "user bấm accept lại / request đã được xử lý trước đó".
      // - Nếu đã là bạn bè, không cần xử lý gì thêm.
      // - Nếu không phải bạn bè và không có pending, throw lỗi NO_PENDING_FRIEND_REQUEST.
      const alreadyFriends = await this.friendshipRepository.findFriendshipPair(fromUserId, myUserId);
      if (alreadyFriends) {
        return;
      }
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_PENDING_FRIEND_REQUEST);
    }

    // kiểm tra xem người nhận có block người gửi không
    if (await this.blockRepository.isBlockedEitherWay(myUserId, fromUserId)) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.FRIEND_ACTION_BLOCKED);
    }

    // Bọc try/catch vì có thể đụng unique index (Mongo error 11000) nếu friendship đã tồn tại do race condition.
    try {
      await this.friendshipRepository.insertFriendship(fromUserId, myUserId);
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        // nếu đã tồn tại friendship, xóa request và invalidate cache
        await Promise.all([
          this.friendRequestRepository.deleteDirectedRequest(fromUserId, myUserId),
          this.invalidateBoth(myUserId, fromUserId)
        ]);
        return;
      }
      throw e;
    }

    await Promise.all([
      // xóa request và invalidate cache
      this.friendRequestRepository.deleteDirectedRequest(fromUserId, myUserId),
      this.invalidateBoth(myUserId, fromUserId),
      // notification "friend accepted" cho người gửi
      this.notificationsService.recordFriendAccepted(fromUserId, myUserId)
    ]);
  }

  async declineIncomingRequest(myUserId: string, fromUserId: string): Promise<void> {
    const deleted = await this.friendRequestRepository.deleteDirectedRequest(fromUserId, myUserId);
    if (deleted === 0) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_PENDING_FRIEND_REQUEST);
    }
    await this.invalidateBoth(myUserId, fromUserId);
  }

  async revokeOutgoingRequest(myUserId: string, toUserId: string): Promise<void> {
    const deleted = await this.friendRequestRepository.deleteDirectedRequest(myUserId, toUserId);
    if (deleted === 0) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_PENDING_FRIEND_REQUEST);
    }
    await this.invalidateBoth(myUserId, toUserId);
  }

  async unfriend(myUserId: string, otherUserId: string): Promise<void> {
    const deleted = await this.friendshipRepository.deleteFriendshipPair(myUserId, otherUserId);
    if (deleted === 0) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_FRIENDSHIP_WITH_USER);
    }
    await this.invalidateBoth(myUserId, otherUserId);
  }

  async listFriends(
    myUserId: string,
    limit: number,
    cursor?: string
  ): Promise<{ users: FriendUserRow[]; nextCursor: string | null }> {
    let decodedCursor: string | undefined;
    if (cursor) {
      try {
        decodedCursor = decodeFriendListCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
      }
    }

    const pageSize = Math.min(100, Math.max(1, limit));
    // lấy danh sách id bạn bè của user theo cursor và limit
    const friendIds = await this.friendshipRepository.listFriendUserIdsForUserByCursor(
      myUserId,
      pageSize + 1,
      decodedCursor
    );
    const hasMore = friendIds.length > pageSize;
    const slice = friendIds.slice(0, pageSize);
    // Lấy thông tin user thật (name/avatar/username…) từ collection users dựa trên list id.
    const users = await this.userRepository.findManyByIds(slice);
    // tạo map từ ID hex string đến user object để tránh lookup lại DB
    // Vì query $in ở DB không đảm bảo giữ thứ tự đầu vào, nên phải map lại theo idStrings.
    // - Đảm bảo response đúng thứ tự phân trang đã tính
    const idToUserMap = new Map(users.map((u) => [u._id.toHexString(), u]));
    // sắp xếp lại danh sách user theo thứ tự idStrings
    const ordered = slice.map((id) => idToUserMap.get(id)).filter((u): u is IUser => Boolean(u));
    // tạo cursor cho trang tiếp theo
    const nextCursor = hasMore && slice.length > 0 ? encodeFriendListCursor(slice[slice.length - 1]) : null;
    // trả về danh sách bạn bè đã sắp xếp và cursor cho trang tiếp theo
    return { users: ordered.map((u) => this.toFriendUserRow(u)), nextCursor };
  }

  async listIncomingRequests(
    myUserId: string,
    limit: number,
    cursor?: string
  ): Promise<{ users: FriendUserRow[]; nextCursor: string | null }> {
    const pageSize = Math.min(100, Math.max(1, limit));

    let decoded: { createdAt: Date; _id: string } | undefined;
    if (cursor) {
      try {
        decoded = decodeFriendRequestCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
      }
    }

    const items = await this.friendRequestRepository.listIncomingForUser(myUserId, pageSize + 1, decoded);
    const hasMore = items.length > pageSize;
    const slice = items.slice(0, pageSize);

    const idStrings = slice.map((r) => r.fromUserId.toHexString());
    const users = await this.userRepository.findManyByIds(idStrings, {
      _id: 1,
      name: 1,
      username: 1,
      avatar: 1
    });
    const byHex = new Map(users.map((u) => [u._id.toHexString(), u]));
    const ordered = idStrings.map((id) => byHex.get(id)).filter((u): u is IUser => Boolean(u));

    const last = slice[slice.length - 1];
    const nextCursor =
      hasMore && last ? encodeFriendRequestCursor(last.createdAt ?? new Date(0), last._id.toHexString()) : null;

    return { users: ordered.map((u) => this.toFriendUserRow(u)), nextCursor };
  }

  async listOutgoingRequests(
    myUserId: string,
    limit: number,
    cursor?: string
  ): Promise<{ users: FriendUserRow[]; nextCursor: string | null }> {
    const pageSize = Math.min(100, Math.max(1, limit));

    let decoded: { createdAt: Date; _id: string } | undefined;
    if (cursor) {
      try {
        decoded = decodeFriendRequestCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
      }
    }

    const items = await this.friendRequestRepository.listOutgoingForUser(myUserId, pageSize + 1, decoded);
    const hasMore = items.length > pageSize;
    const slice = items.slice(0, pageSize);

    const idStrings = slice.map((r) => r.toUserId.toHexString());
    const users = await this.userRepository.findManyByIds(idStrings, {
      _id: 1,
      name: 1,
      username: 1,
      avatar: 1
    });
    const byHex = new Map(users.map((u) => [u._id.toHexString(), u]));
    const ordered = idStrings.map((id) => byHex.get(id)).filter((u): u is IUser => Boolean(u));

    const last = slice[slice.length - 1];
    const nextCursor =
      hasMore && last ? encodeFriendRequestCursor(last.createdAt ?? new Date(0), last._id.toHexString()) : null;

    return { users: ordered.map((u) => this.toFriendUserRow(u)), nextCursor };
  }
}
