import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/application/ports/queries/conversation-member-query.repository';
import {
  IListConversationsForUserInput,
  IListConversationsForUserOutput
} from '@/modules/conversation/application/ports/queries/conversation-member-query.type';
import { ConversationMemberModel } from '@/modules/conversation/infrastructure/mongo/conversation-member.model';
import { Collection, Db, Document, MongoClient } from 'mongodb';

export class ConversationMemberQueryRepository implements ConversationMemberQueryRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient
  ) {}

  get dbCollection(): Collection<ConversationMemberModel> {
    return this.db.collection<ConversationMemberModel>('conversation_members');
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
            { 'conv.updated_at': { $lt: updatedAt } },
            { $and: [{ 'conv.updated_at': updatedAt }, { 'conv._id': { $lt: id } }] }
          ]
        }
      });
    }

    const pipeline: Document[] = [
      { $match: { user_id: userId } },
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversation_id',
          foreignField: '_id',
          as: 'conv'
        }
      },
      { $unwind: '$conv' },
      ...matchCursor,
      { $sort: { 'conv.updated_at': -1, 'conv._id': -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          conversationId: '$conv._id',
          updatedAt: '$conv.updated_at'
        }
      }
    ];

    return this.dbCollection.aggregate<IListConversationsForUserOutput>(pipeline).toArray();
  }
}
