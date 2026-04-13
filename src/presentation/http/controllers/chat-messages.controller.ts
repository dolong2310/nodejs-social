import { IChatMessagesService } from '@/application/ports/chat-message.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  MarkChatReadBodyDTO,
  SendChatMessageBodyDTO
} from '@/presentation/http/dtos/chat-message/chat-messages.request.dto';
import { CursorPaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import { ConversationIdParams } from '@/presentation/http/dtos/conversation/conversations.request.dto';
import { Created } from '@/presentation/http/responses/success.response';

import { Request, Response } from 'express';

export interface IChatMessagesController {
  sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response): Promise<void>;
  listMessages(
    req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>,
    res: Response
  ): Promise<void>;
  markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>, res: Response): Promise<void>;
}

export class ChatMessagesController extends BaseController implements IChatMessagesController {
  constructor(private readonly chatMessagesService: IChatMessagesService) {
    super();
  }

  @AutoBind()
  async sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new SendChatMessageBodyDTO(req.body);
    const msg = await this.chatMessagesService.sendMessage({
      userId,
      conversationId,
      text: body.text,
      attachments: body.attachments
    });
    this.sendResponse({ res, instance: Created, data: msg, message: 'Message sent' });
  }

  @AutoBind()
  async listMessages(req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { conversationId } = req.params;
    const { items, nextCursor } = await this.chatMessagesService.listMessages({
      userId,
      conversationId,
      limit: Number(limit),
      cursor
    });
    this.sendCursorPaginatedResponse({
      res,
      items,
      nextCursor,
      message: 'Messages loaded'
    });
  }

  @AutoBind()
  async markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new MarkChatReadBodyDTO(req.body);
    await this.chatMessagesService.markRead({ userId, conversationId, lastReadMessageId: body.lastReadMessageId });
    this.sendResponse({ res, data: null, message: 'Read state updated' });
  }
}
