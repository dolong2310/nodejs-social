import type { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import {
  OnlyOwnerOrAdminCanDeletePostException,
  PostNotFoundException
} from '@/modules/post/application/exceptions/post.exception';
import {
  type DeletePostInputPort,
  DeletePostPort
} from '@/modules/post/application/use-cases/delete-post/delete-post.port';
import type { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';

export class DeletePostUseCase extends DeletePostPort {
  constructor(
    private readonly postRepository: PostRepositoryPort,
    private readonly roleService: RoleServicePort
  ) {
    super();
  }

  async execute(input: DeletePostInputPort): Promise<void> {
    const post = await this.postRepository.findPostById(input.postId);
    if (!post) {
      throw new PostNotFoundException();
    }

    const postProps = post.getProps();
    const isOwner = postProps.userId === input.userId;
    if (!isOwner) {
      const adminRoleId = await this.roleService.getAdminRoleId();
      if (input.roleId !== adminRoleId) {
        throw new OnlyOwnerOrAdminCanDeletePostException();
      }
    }

    const deletedCount = await this.postRepository.deletePostTree({
      postId: input.postId,
      actorId: input.userId
    });
    if (deletedCount === 0) {
      throw new PostNotFoundException();
    }
  }
}
