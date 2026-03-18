import { BaseController } from '@/controllers/base.controller';
import { IGetConversationsRequestParams, IGetConversationsRequestQuery } from '@/models/requests/conversation.request';
import { Created, OK } from '@/responses/success.response';
import { IConversationsService } from '@/services/conversations.service';
import { TokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

export interface IConversationsController {
  getConversations(
    req: Request<IGetConversationsRequestParams, {}, {}, IGetConversationsRequestQuery>,
    res: Response
  ): Promise<void>;
  createConversation(req: Request, res: Response): Promise<void>;
}

class ConversationsController extends BaseController implements IConversationsController {
  constructor(private readonly conversationsService: IConversationsService) {
    super();
  }

  async getConversations(
    req: Request<IGetConversationsRequestParams, {}, {}, IGetConversationsRequestQuery>,
    res: Response
  ) {
    const { userId } = req.tokenPayload as TokenPayload;
    const { receiverId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const { conversations, totalConversations } = await this.conversationsService.getConversations({
      senderId: userId,
      receiverId,
      page: pageNumber,
      limit: limitNumber
    });

    new OK({
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

  async createConversation(req: Request, res: Response) {
    const { userId } = req.tokenPayload as TokenPayload;
    const { receiverId, content } = req.body;

    const conversation = await this.conversationsService.createConversation({
      senderId: userId,
      receiverId,
      content,
      lastMessage: content
    });

    new Created({
      data: conversation,
      message: 'Create conversation successfully'
    }).send(res);
  }
}

export default ConversationsController;
