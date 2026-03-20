import { BaseController } from '@/controllers/base.controller';
import { GetConversationsParamsDTO, GetConversationsQueryDTO } from '@/dtos/requests/conversation.request.dto';
import { ConversationResponseDTO } from '@/dtos/responses/conversation.response.dto';
import { IConversation } from '@/models/schemas/conversation.schema';
import { Created } from '@/responses/success.response';
import { IConversationsService } from '@/services/conversations.service';
import { Request, Response } from 'express';

export interface IConversationsController {
  getConversations(
    req: Request<GetConversationsParamsDTO, object, object, GetConversationsQueryDTO>,
    res: Response
  ): Promise<void>;
  createConversation(req: Request, res: Response): Promise<void>;
}

class ConversationsController extends BaseController implements IConversationsController {
  constructor(private readonly conversationsService: IConversationsService) {
    super();
  }

  getConversations = async (
    req: Request<GetConversationsParamsDTO, object, object, GetConversationsQueryDTO>,
    res: Response
  ) => {
    const userId = this.getUserId(req);
    const { receiverId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const { conversations, totalConversations } = await this.conversationsService.getConversations({
      senderId: userId,
      receiverId,
      page,
      limit
    });

    this.sendPaginatedResponse<IConversation[], ConversationResponseDTO>({
      res,
      data: conversations,
      pagination: {
        page,
        limit,
        totalItems: totalConversations
      },
      message: 'Get conversations successfully'
    });
  };

  createConversation = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { receiverId, content } = req.body;

    const conversation = await this.conversationsService.createConversation({
      senderId: userId,
      receiverId,
      content,
      lastMessage: content
    });

    this.sendResponse<IConversation>({
      res,
      instance: Created,
      data: conversation,
      message: 'Create conversation successfully'
    });
  };
}

export default ConversationsController;
