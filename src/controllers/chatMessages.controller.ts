import { BaseController } from '@/controllers/base.controller';
import { ChatIdParams } from '@/controllers/chats.controller';
import { MarkChatReadBodyDTO, SendChatMessageBodyDTO } from '@/dtos/requests/chatMessage.request.dto';
import { Created } from '@/responses/success.response';
import { IChatMessagesService } from '@/services/chatMessages.service';
import { Request, Response } from 'express';

export interface IChatMessagesController {
  sendMessage(req: Request<ChatIdParams, object, SendChatMessageBodyDTO>, res: Response): Promise<void>;
  listMessages(req: Request<ChatIdParams>, res: Response): Promise<void>;
  markRead(req: Request<ChatIdParams, object, MarkChatReadBodyDTO>, res: Response): Promise<void>;
}

class ChatMessagesController extends BaseController implements IChatMessagesController {
  constructor(private readonly chatMessagesService: IChatMessagesService) {
    super();
  }

  sendMessage = async (req: Request<ChatIdParams, object, SendChatMessageBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new SendChatMessageBodyDTO(req.body);
    const msg = await this.chatMessagesService.sendMessage(userId, req.params.chatId, body);
    this.sendResponse({ res, instance: Created, data: msg, message: 'Message sent' });
  };

  listMessages = async (req: Request<ChatIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const page = await this.chatMessagesService.listMessages(userId, req.params.chatId, limit, cursor);
    this.sendResponse({ res, data: page, message: 'Messages loaded' });
  };

  markRead = async (req: Request<ChatIdParams, object, MarkChatReadBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new MarkChatReadBodyDTO(req.body);
    await this.chatMessagesService.markRead(userId, req.params.chatId, body);
    this.sendResponse({ res, data: null, message: 'Read state updated' });
  };
}

export default ChatMessagesController;
