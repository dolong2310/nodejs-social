import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { ChatMessagesService } from '@/modules/chatMessages/chatMessages.service';
import { MarkChatReadBodyDTO, SendChatMessageBodyDTO } from '@/modules/chatMessages/dtos/chatMessages.request.dto';
import { ConversationIdParams } from '@/modules/conversations/dtos/conversations.request.dto';
import { Created } from '@/providers/httpResponses/success.response';
import { CursorPaginationQueryDTO } from '@/shared/dtos/common.request.dto';
import { Request, Response } from 'express';

export interface IChatMessagesController {
  sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response): Promise<void>;
  listMessages(
    req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>,
    res: Response
  ): Promise<void>;
  markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>, res: Response): Promise<void>;
}

@Injectable()
export class ChatMessagesController extends BaseController implements IChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {
    super();
  }

  @AutoBind()
  async sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new SendChatMessageBodyDTO(req.body);
    const msg = await this.chatMessagesService.sendMessage(userId, conversationId, body);
    this.sendResponse({ res, instance: Created, data: msg, message: 'Message sent' });
  }

  @AutoBind()
  async listMessages(req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { conversationId } = req.params;
    const page = await this.chatMessagesService.listMessages(userId, conversationId, Number(limit), cursor);
    this.sendCursorPaginatedResponse({
      res,
      items: page.messages,
      nextCursor: page.nextCursor,
      message: 'Messages loaded'
    });
  }

  @AutoBind()
  async markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new MarkChatReadBodyDTO(req.body);
    await this.chatMessagesService.markRead(userId, conversationId, body);
    this.sendResponse({ res, data: null, message: 'Read state updated' });
  }
}
