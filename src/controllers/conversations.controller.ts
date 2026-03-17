import { IGetConversationsRequestParams, IGetConversationsRequestQuery } from '@/models/requests/conversation.request';
import { OK } from '@/models/success.response';
import conversationsService from '@/services/conversations.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class ConversationsController {
  constructor() {}

  async getConversations(
    req: Request<IGetConversationsRequestParams, {}, {}, IGetConversationsRequestQuery>,
    res: Response
  ) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { receiverId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const { conversations, totalConversations } = await conversationsService.getConversations({
      senderId: userId,
      receiverId,
      page: pageNumber,
      limit: limitNumber
    });

    return new OK({
      data: {
        conversations,
        page: pageNumber,
        limit: limitNumber,
        totalItems: totalConversations,
        totalPages: Math.ceil(totalConversations / limitNumber)
      },
      message: 'Get conversations successfully'
    }).send(res);
  }
}

export default new ConversationsController();
