import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import {
  GetFriendsInPort,
  GetFriendsQuery,
  GetFriendsResult
} from '@/modules/friend/application/use-cases/get-friends/get-friends.in-port';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class GetFriendsInteractor extends GetFriendsInPort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly userRepository: UserRepositoryPort
  ) {
    super();
  }

  async execute({ userId, limit, cursor }: GetFriendsQuery): Promise<GetFriendsResult> {
    const decodedCursor = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw, true), InvalidCursorException);

    const pageSize = Math.min(100, Math.max(1, limit));
    // lấy danh sách id bạn bè của user theo cursor và limit
    const friendIds = await this.friendshipRepository.listFriendIdsByCursor({
      userId,
      limit: pageSize + 1,
      cursor: decodedCursor
    });
    const hasMore = friendIds.length > pageSize;
    const ids = friendIds.slice(0, pageSize);
    // Lấy thông tin user thật (name/avatar/username…) từ collection users dựa trên list id.
    const users = (await this.userRepository.findManyUsersByIds(ids)).map((user) => user.toObject());
    // tạo map từ ID hex string đến user object để tránh lookup lại DB
    // Vì query $in ở DB không đảm bảo giữ thứ tự đầu vào, nên phải map lại theo idStrings.
    // - Đảm bảo response đúng thứ tự phân trang đã tính
    const idToUserMap = new Map(users.map((user) => [user.id, user]));
    // sắp xếp lại danh sách user theo thứ tự idStrings
    const ordered = ids.map((id) => idToUserMap.get(id)).filter((u): u is UserFullProps => Boolean(u));
    // tạo cursor cho trang tiếp theo
    const nextCursor = hasMore && ids.length > 0 ? encodeCursor(ids[ids.length - 1]) : null;
    // trả về danh sách bạn bè đã sắp xếp và cursor cho trang tiếp theo
    const items = ordered.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    }));

    return new GetFriendsResult(items, nextCursor);
  }
}
