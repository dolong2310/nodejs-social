import { GetMessagesInPort } from '@/modules/conversation/application/use-cases/get-messages/get-messages.in-port';
import { MarkReadInPort } from '@/modules/conversation/application/use-cases/mark-read-message/mark-read-message.in-port';
import { SendMessageInPort } from '@/modules/conversation/application/use-cases/send-message/send-message.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import {
  MarkChatReadBodyDTO,
  SendChatMessageBodyDTO
} from '@/presentation/http/express/v1/dtos/chat-message/chat-message.request.dto';
import { ChatMessageResponseDTO } from '@/presentation/http/express/v1/dtos/chat-message/chat-message.response.dto';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import { ConversationIdParams } from '@/presentation/http/express/v1/dtos/conversation/conversation.request.dto';
import { Request } from 'express';

export interface IChatMessageController {
  sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>): Promise<unknown>;
  listMessages(req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>): Promise<unknown>;
  markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>): Promise<unknown>;
}

export class ChatMessageController extends BaseController implements IChatMessageController {
  constructor(
    private readonly sendMessageUC: SendMessageInPort,
    private readonly listMessagesUC: GetMessagesInPort,
    private readonly markReadUC: MarkReadInPort
  ) {
    super();
  }

  @AutoBind()
  async sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>) {
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
  async listMessages(req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>) {
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
  async markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new MarkChatReadBodyDTO(req.body);

    await this.markReadUC.execute({ userId, conversationId, lastReadMessageId: body.lastReadMessageId });

    return this.response({ message: 'Read state updated' });
  }
}
