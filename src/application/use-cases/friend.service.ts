import { IUser } from '@/domain/entities/user.entity';
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { IFriendRequestRepository } from '@/domain/repositories/friend-request/friend-request.repository';
import { IFriendshipRepository } from '@/domain/repositories/friendship/friendship.repository';
import { IUserRepository } from '@/domain/repositories/user/user.repository';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

import { CACHE_KEYS, CACHE_TTL } from '@/application/common/constants/cache.constant';
import { decodeCursorOrThrow } from '@/application/common/cursor-codec/cursor-decoder.codec';
import {
  decodeFriendRequestCursor,
  encodeFriendRequestCursor
} from '@/application/common/cursor-codec/friend-request.cursor-codec';
import { decodeFriendListCursor, encodeFriendListCursor } from '@/application/common/cursor-codec/friend.cursor-codec';
import {
  AcceptIncomingRequestPayloadDTO,
  AreAllFriendsPayloadDTO,
  DeclineIncomingRequestPayloadDTO,
  FindFriendUserIdsPayloadDTO,
  InvalidateFriendCachePayloadDTO,
  IsFriendOfPayloadDTO,
  ListFriendsPayloadDTO,
  ListIncomingRequestsPayloadDTO,
  ListOutgoingRequestsPayloadDTO,
  RevokeOutgoingRequestPayloadDTO,
  SendFriendRequestPayloadDTO,
  UnfriendPayloadDTO
} from '@/application/dtos/friend/friend.payload.dto';
import {
  AreAllFriendsResultDTO,
  FindFriendUserIdsResultDTO,
  FriendListPaginationResultDTO,
  FriendUserRow,
  IsFriendOfResultDTO,
  SendFriendRequestResultDTO
} from '@/application/dtos/friend/friend.result.dto';
import {
  AlreadyFriendsException,
  CannotSendFriendRequestToYourselfException,
  FriendActionBlockedException,
  FriendRequestDailyLimitExceededException,
  FriendUserNotFoundException,
  InvalidCursorException,
  NoFriendshipWithUserException,
  NoPendingFriendRequestException
} from '@/application/errors/friend.error';
import { IFriendsService } from '@/application/ports/friend.port';
import { INotificationsService } from '@/application/ports/notification.port';
import { IRedisService } from '@/application/ports/redis.port';
import { BaseService } from '@/application/use-cases/base.service';

export class FriendsService extends BaseService implements IFriendsService {
  private static readonly OUTGOING_REQUESTS_PER_UTC_DAY = 100;

  constructor(
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly friendRequestRepository: IFriendRequestRepository,
    private readonly blockRepository: IBlockRepository,
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
      id: user.id,
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
    await Promise.all([
      this.invalidateFriendCache({ userId: userIdA }),
      this.invalidateFriendCache({ userId: userIdB })
    ]);
  }

  async findFriendUserIds({ userId }: FindFriendUserIdsPayloadDTO): Promise<FindFriendUserIdsResultDTO> {
    const cached = await this.redisService.get<string[]>(CACHE_KEYS.friends(userId));
    if (cached !== null) {
      return new FindFriendUserIdsResultDTO(cached);
    }

    const friendIds = await this.friendshipRepository.findFriendIdsByUserId({ userId });
    await this.redisService.set(CACHE_KEYS.friends(userId), friendIds, CACHE_TTL.FRIENDS_GRAPH);

    return new FindFriendUserIdsResultDTO(friendIds);
  }

  async isFriendOf({ viewerUserId, otherUserId }: IsFriendOfPayloadDTO): Promise<IsFriendOfResultDTO> {
    const pair = await this.friendshipRepository.findFriendshipPair({ aUserId: viewerUserId, bUserId: otherUserId });
    return new IsFriendOfResultDTO(pair !== null);
  }

  /**
   * Lấy tất cả số lượng member trong group là bạn bè của admin và so sánh với số lượng member trong group (trừ admin ra) phải bằng nhau.
   */
  async areAllFriends({ viewerUserId, otherUserIds }: AreAllFriendsPayloadDTO): Promise<AreAllFriendsResultDTO> {
    if (otherUserIds.length === 0) {
      return new AreAllFriendsResultDTO(true);
    }
    const number = await this.friendshipRepository.countFriendshipsWithUserAmongOthers({
      userId: viewerUserId,
      otherUserIds
    });
    return new AreAllFriendsResultDTO(number === otherUserIds.length);
  }

  async invalidateFriendCache({ userId }: InvalidateFriendCachePayloadDTO): Promise<void> {
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
  async sendFriendRequest({ myUserId, toUserId }: SendFriendRequestPayloadDTO): Promise<SendFriendRequestResultDTO> {
    if (myUserId === toUserId) {
      throw CannotSendFriendRequestToYourselfException;
    }

    // kiểm tra xem người được gửi yêu cầu có tồn tại không
    const target = await this.userRepository.findUserById({ id: toUserId });
    if (!target) {
      throw FriendUserNotFoundException;
    }

    const { start, endExclusive } = this.utcDayRange(new Date());
    const [isBlockedEitherWay, existingFriendship, sentToday] = await Promise.all([
      this.blockRepository.isBlockedEitherWay({ aUserId: myUserId, bUserId: toUserId }),
      this.friendshipRepository.findFriendshipPair({ aUserId: myUserId, bUserId: toUserId }),
      this.friendRequestRepository.countOutgoingRequestsCreatedOnUtcDay({
        fromUserId: myUserId,
        dayStart: start,
        dayEndExclusive: endExclusive
      })
    ]);

    // kiểm tra xem người được gửi yêu cầu có block người gửi không
    if (isBlockedEitherWay) {
      throw FriendActionBlockedException;
    }

    // kiểm tra xem người được gửi yêu cầu có là bạn bè với người gửi không
    if (existingFriendship) {
      throw AlreadyFriendsException;
    }

    // kiểm tra xem người gửi có vượt quá số lượng yêu cầu kết bạn tới người được gửi yêu cầu không
    // Vì 1 ngày chỉ được gửi 100 yêu cầu kết bạn tới người được gửi yêu cầu không => tránh spam
    if (sentToday >= FriendsService.OUTGOING_REQUESTS_PER_UTC_DAY) {
      throw FriendRequestDailyLimitExceededException;
    }

    // try/catch để bắt lỗi Mongo duplicate key 11000 (thường do unique index theo cặp directed fromUserId+toUserId)
    // -> map sang lỗi nghiệp vụ FRIEND_REQUEST_ALREADY_PENDING (409).
    // - nếu đang có request B->A pending, hệ thống vẫn cho phép A gửi A->B (tạo 2 request ngược chiều cùng lúc).
    // - DB chỉ chống trùng cùng chiều (A->B) chứ không chống "ngược chiều".
    // - đây là lựa chọn nghiệp vụ (có hệ thống sẽ tự chuyển thành "accept" hoặc chặn, nhưng ở đây thì không).
    const created = await this.friendRequestRepository.createPendingRequest({ fromUserId: myUserId, toUserId });
    // invalidate cache của người gửi
    await this.invalidateFriendCache({ userId: myUserId });
    // notification "friend request" cho người nhận
    await this.notificationsService.recordFriendRequest({ recipientUserId: toUserId, fromUserId: myUserId });

    return new SendFriendRequestResultDTO(created);
  }

  async acceptIncomingRequest({ myUserId, fromUserId }: AcceptIncomingRequestPayloadDTO): Promise<void> {
    // kiểm tra xem người nhận có yêu cầu kết bạn tới người gửi không
    const pending = await this.friendRequestRepository.findPendingRequestByUserPair({ fromUserId, toUserId: myUserId });
    if (!pending) {
      // kiểm tra xem người gửi và người nhận đã là bạn bè không
      // Mục tiêu: xử lý case "user bấm accept lại / request đã được xử lý trước đó".
      // - Nếu đã là bạn bè, không cần xử lý gì thêm.
      // - Nếu không phải bạn bè và không có pending, throw lỗi NO_PENDING_FRIEND_REQUEST.
      const alreadyFriends = await this.friendshipRepository.findFriendshipPair({
        aUserId: fromUserId,
        bUserId: myUserId
      });
      if (alreadyFriends) {
        return;
      }
      throw NoPendingFriendRequestException;
    }

    // kiểm tra xem người nhận có block người gửi không
    if (await this.blockRepository.isBlockedEitherWay({ aUserId: myUserId, bUserId: fromUserId })) {
      throw FriendActionBlockedException;
    }

    const doc = await this.friendshipRepository.createFriendship({ aUserId: fromUserId, bUserId: myUserId });
    if (!doc) {
      // nếu đã tồn tại friendship, xóa request và invalidate cache
      await Promise.all([
        this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: myUserId }),
        this.invalidateBoth(myUserId, fromUserId)
      ]);
      return;
    }

    await Promise.all([
      // xóa request và invalidate cache
      this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: myUserId }),
      this.invalidateBoth(myUserId, fromUserId),
      // notification "friend accepted" cho người gửi
      this.notificationsService.recordFriendAccepted({ originalRequesterUserId: fromUserId, accepterUserId: myUserId })
    ]);
  }

  async declineIncomingRequest({ myUserId, fromUserId }: DeclineIncomingRequestPayloadDTO): Promise<void> {
    const deleted = await this.friendRequestRepository.deletePendingRequest({ fromUserId, toUserId: myUserId });
    if (deleted === 0) {
      throw NoPendingFriendRequestException;
    }
    await this.invalidateBoth(myUserId, fromUserId);
  }

  async revokeOutgoingRequest({ myUserId, toUserId }: RevokeOutgoingRequestPayloadDTO): Promise<void> {
    const deleted = await this.friendRequestRepository.deletePendingRequest({ fromUserId: myUserId, toUserId });
    if (deleted === 0) {
      throw NoPendingFriendRequestException;
    }
    await this.invalidateBoth(myUserId, toUserId);
  }

  async unfriend({ myUserId, otherUserId }: UnfriendPayloadDTO): Promise<void> {
    const deleted = await this.friendshipRepository.deleteFriendship({ aUserId: myUserId, bUserId: otherUserId });
    if (deleted === 0) {
      throw NoFriendshipWithUserException;
    }
    await this.invalidateBoth(myUserId, otherUserId);
  }

  async listFriends({ myUserId, limit, cursor }: ListFriendsPayloadDTO): Promise<FriendListPaginationResultDTO> {
    const decodedCursor = decodeCursorOrThrow(cursor, decodeFriendListCursor, InvalidCursorException);

    const pageSize = Math.min(100, Math.max(1, limit));
    // lấy danh sách id bạn bè của user theo cursor và limit
    const friendIds = await this.friendshipRepository.listFriendIdsByCursor({
      userId: myUserId,
      limit: pageSize + 1,
      cursor: decodedCursor
    });
    const hasMore = friendIds.length > pageSize;
    const slice = friendIds.slice(0, pageSize);
    // Lấy thông tin user thật (name/avatar/username…) từ collection users dựa trên list id.
    const users = await this.userRepository.findManyUsersByIds({ ids: slice });
    // tạo map từ ID hex string đến user object để tránh lookup lại DB
    // Vì query $in ở DB không đảm bảo giữ thứ tự đầu vào, nên phải map lại theo idStrings.
    // - Đảm bảo response đúng thứ tự phân trang đã tính
    const idToUserMap = new Map(users.map((u) => [u.id, u]));
    // sắp xếp lại danh sách user theo thứ tự idStrings
    const ordered = slice.map((id) => idToUserMap.get(id)).filter((u): u is IUser => Boolean(u));
    // tạo cursor cho trang tiếp theo
    const nextCursor = hasMore && slice.length > 0 ? encodeFriendListCursor(slice[slice.length - 1]) : null;
    // trả về danh sách bạn bè đã sắp xếp và cursor cho trang tiếp theo
    const items = ordered.map((u) => this.toFriendUserRow(u));

    return new FriendListPaginationResultDTO(items, nextCursor);
  }

  async listIncomingRequests({
    myUserId,
    limit,
    cursor
  }: ListIncomingRequestsPayloadDTO): Promise<FriendListPaginationResultDTO> {
    const pageSize = Math.min(100, Math.max(1, limit));

    const decoded: DateIdCursor | undefined = decodeCursorOrThrow(
      cursor,
      decodeFriendRequestCursor,
      InvalidCursorException
    );

    const incomingRequests = await this.friendRequestRepository.listIncomingForUser({
      toUserId: myUserId,
      limit: pageSize + 1,
      cursor: decoded
    });
    const hasMore = incomingRequests.length > pageSize;
    const slice = incomingRequests.slice(0, pageSize);

    const idStrings = slice.map((request) => request.fromUserId);
    const users = await this.userRepository.findManyUsersByIdsIncludeNameUsernameAvatar({ ids: idStrings });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const ordered = idStrings.map((id) => userMap.get(id)).filter((u): u is IUser => Boolean(u));

    const last = slice[slice.length - 1];
    const nextCursor = hasMore && last ? encodeFriendRequestCursor(last.createdAt ?? new Date(0), last.id) : null;

    const items = ordered.map((u) => this.toFriendUserRow(u));
    return new FriendListPaginationResultDTO(items, nextCursor);
  }

  async listOutgoingRequests({
    myUserId,
    limit,
    cursor
  }: ListOutgoingRequestsPayloadDTO): Promise<FriendListPaginationResultDTO> {
    const pageSize = Math.min(100, Math.max(1, limit));

    const decoded: DateIdCursor | undefined = decodeCursorOrThrow(
      cursor,
      decodeFriendRequestCursor,
      InvalidCursorException
    );

    const outgoingRequests = await this.friendRequestRepository.listOutgoingForUser({
      fromUserId: myUserId,
      limit: pageSize + 1,
      cursor: decoded
    });
    const hasMore = outgoingRequests.length > pageSize;
    const slice = outgoingRequests.slice(0, pageSize);

    const idStrings = slice.map((request) => request.toUserId);
    const users = await this.userRepository.findManyUsersByIdsIncludeNameUsernameAvatar({ ids: idStrings });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const ordered = idStrings.map((id) => userMap.get(id)).filter((u): u is IUser => Boolean(u));

    const last = slice[slice.length - 1];
    const nextCursor = hasMore && last ? encodeFriendRequestCursor(last.createdAt ?? new Date(0), last.id) : null;

    const items = ordered.map((u) => this.toFriendUserRow(u));
    return new FriendListPaginationResultDTO(items, nextCursor);
  }
}
