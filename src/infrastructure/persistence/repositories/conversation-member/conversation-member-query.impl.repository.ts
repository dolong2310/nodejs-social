import { ConversationMemberQueryRepositoryPort } from '@/application/queries/conversation-member/conversation-member-query.repository';
import {
  IListConversationsForUserInput,
  IListConversationsForUserOutput
} from '@/application/queries/conversation-member/conversation-member-query.type';
import { ConversationMemberModel } from '@/infrastructure/persistence/repositories/conversation-member/conversation-member.model';
import { Collection, Db, Document, MongoClient } from 'mongodb';

export class ConversationMemberQueryRepository implements ConversationMemberQueryRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient
  ) {}

  get dbCollection(): Collection<ConversationMemberModel> {
    return this.db.collection<ConversationMemberModel>('conversationMembers');
  }

  async listConversationsForUser({
    userId,
    limit,
    cursor
  }: IListConversationsForUserInput): Promise<IListConversationsForUserOutput[]> {
    const matchCursor: Document[] = [];
    if (cursor) {
      const { id, createdAt: updatedAt } = cursor.raw();
      matchCursor.push({
        $match: {
          $or: [
            { 'conv.updatedAt': { $lt: updatedAt } },
            { $and: [{ 'conv.updatedAt': updatedAt }, { 'conv._id': { $lt: id } }] }
          ]
        }
      });
    }

    const pipeline: Document[] = [
      { $match: { userId } },
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversationId',
          foreignField: '_id',
          as: 'conv'
        }
      },
      { $unwind: '$conv' },
      ...matchCursor,
      { $sort: { 'conv.updatedAt': -1, 'conv._id': -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          conversationId: '$conv._id',
          updatedAt: '$conv.updatedAt'
        }
      }
    ];

    return this.dbCollection.aggregate<IListConversationsForUserOutput>(pipeline).toArray();
  }
}
