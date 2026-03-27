import {
  BaseController,
  ConversationIdParams,
  IChatMessagesService,
  MarkChatReadBodyDTO,
  SendChatMessageBodyDTO
} from '@/modules';
import { Created } from '@/providers';
import { Request, Response } from 'express';

export interface IChatMessagesController {
  sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response): Promise<void>;
  listMessages(req: Request<ConversationIdParams>, res: Response): Promise<void>;
  markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>, res: Response): Promise<void>;
}

export class ChatMessagesController extends BaseController implements IChatMessagesController {
  constructor(private readonly chatMessagesService: IChatMessagesService) {
    super();
  }

  sendMessage = async (req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new SendChatMessageBodyDTO(req.body);
    const msg = await this.chatMessagesService.sendMessage(userId, req.params.conversationId, body);
    this.sendResponse({ res, instance: Created, data: msg, message: 'Message sent' });
  };

  listMessages = async (req: Request<ConversationIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const page = await this.chatMessagesService.listMessages(userId, req.params.conversationId, limit, cursor);
    this.sendResponse({ res, data: page, message: 'Messages loaded' });
  };

  markRead = async (req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new MarkChatReadBodyDTO(req.body);
    await this.chatMessagesService.markRead(userId, req.params.conversationId, body);
    this.sendResponse({ res, data: null, message: 'Read state updated' });
  };
}
