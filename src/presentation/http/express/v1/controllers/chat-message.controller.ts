import { GetMessagesPort } from '@/modules/conversation/application/use-cases/get-messages/get-messages.port';
import { MarkReadPort } from '@/modules/conversation/application/use-cases/mark-read-message/mark-read-message.port';
import { SendMessagePort } from '@/modules/conversation/application/use-cases/send-message/send-message.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import {
  MarkChatReadBodyDTO,
  SendChatMessageBodyDTO
} from '@/presentation/http/express/v1/dtos/chat-message/chat-message.request.dto';
import { ChatMessageResponseDTO } from '@/presentation/http/express/v1/dtos/chat-message/chat-message.response.dto';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import { ConversationIdParams } from '@/presentation/http/express/v1/dtos/conversation/conversation.request.dto';
import { NextFunction } from 'express';

export interface IChatMessageController {
  sendMessage(
    req: ExpressRequest<ConversationIdParams, object, SendChatMessageBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<ChatMessageResponseDTO>>;
  listMessages(
    req: ExpressRequest<ConversationIdParams, object, object, CursorPaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  markRead(
    req: ExpressRequest<ConversationIdParams, object, MarkChatReadBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
}

export class ChatMessageController extends BaseController implements IChatMessageController {
  constructor(
    private readonly sendMessageUC: SendMessagePort,
    private readonly listMessagesUC: GetMessagesPort,
    private readonly markReadUC: MarkReadPort
  ) {
    super();
  }

  @AutoBind()
  async sendMessage(req: ExpressRequest<ConversationIdParams, object, SendChatMessageBodyDTO>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new SendChatMessageBodyDTO(req.body);

    const message = await this.sendMessageUC.execute({
      userId,
      conversationId,
      text: body.text,
      attachments: body.attachments
    });

    return this.response<ChatMessageResponseDTO>({
      instance: Created,
      data: new ChatMessageResponseDTO(message),
      message: 'Message sent'
    });
  }

  @AutoBind()
  async listMessages(req: ExpressRequest<ConversationIdParams, object, object, CursorPaginationQueryDTO>) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { conversationId } = req.params;

    const { items, nextCursor } = await this.listMessagesUC.execute({
      userId,
      conversationId,
      limit: Number(limit),
      cursor
    });

    return this.cursorPaginatedResponse<ChatMessageResponseDTO>({
      items,
      nextCursor,
      message: 'Messages loaded'
    });
  }

  @AutoBind()
  async markRead(req: ExpressRequest<ConversationIdParams, object, MarkChatReadBodyDTO>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new MarkChatReadBodyDTO(req.body);

    await this.markReadUC.execute({ userId, conversationId, lastReadMessageId: body.lastReadMessageId });

    return this.response({ message: 'Read state updated' });
  }
}
