import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import {
  OnlyOwnerOrAdminCanDeletePostException,
  PostNotFoundException
} from '@/modules/post/application/exceptions/post.exception';
import { DeletePostCommand, DeletePostPort } from '@/modules/post/application/use-cases/delete-post/delete-post.port';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';

export class DeletePostUseCase extends DeletePostPort {
  constructor(
    private readonly postRepository: PostRepositoryPort,
    private readonly roleService: RoleServicePort
  ) {
    super();
  }

  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postRepository.findPostById(command.postId);
    if (!post) {
      throw new PostNotFoundException();
    }

    const postProps = post.getProps();
    const isOwner = postProps.userId === command.userId;
    if (!isOwner) {
      const adminRoleId = await this.roleService.getAdminRoleId();
      if (command.roleId !== adminRoleId) {
        throw new OnlyOwnerOrAdminCanDeletePostException();
      }
    }

    const deletedCount = await this.postRepository.deletePostTree({
      postId: command.postId,
      actorId: command.userId
    });
    if (deletedCount === 0) {
      throw new PostNotFoundException();
    }
  }
}
