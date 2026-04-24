import { ConversationMemberQueryRepositoryPort } from '@/application/queries/conversation-member/conversation-member-query.repository';
import { PostQueryRepositoryPort } from '@/application/queries/post/post-query.repository';
import { UserQueryRepositoryPort } from '@/application/queries/user/user-query.repository';
import { ConversationMemberQueryRepository } from '@/infrastructure/persistence/repositories/conversation-member/conversation-member-query.impl.repository';
import { PostQueryRepository } from '@/infrastructure/persistence/repositories/post/post-query.impl.repository';
import { UserQueryRepository } from '@/infrastructure/persistence/repositories/user/user-query.impl.repository';
import { Db, MongoClient } from 'mongodb';

export type ContainerQueryRepositories = {
  postQueryRepository: PostQueryRepositoryPort;
  userQueryRepository: UserQueryRepositoryPort;
  conversationMemberQueryRepository: ConversationMemberQueryRepositoryPort;
};

export function createContainerQueryRepositories(db: Db, dbClient: MongoClient): ContainerQueryRepositories {
  return {
    postQueryRepository: new PostQueryRepository(db, dbClient),
    userQueryRepository: new UserQueryRepository(db, dbClient),
    conversationMemberQueryRepository: new ConversationMemberQueryRepository(db, dbClient)
  };
}
