import type { GetMessagesPort } from '@/modules/conversation/application/use-cases/get-messages/get-messages.port';
import type { MarkReadPort } from '@/modules/conversation/application/use-cases/mark-read-message/mark-read-message.port';
import type { SendMessagePort } from '@/modules/conversation/application/use-cases/send-message/send-message.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, type SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type {
  MarkChatReadBodySchema,
  SendChatMessageBodySchema
} from '@/presentation/http/express/v1/schemas/chat-message/chat-message.request.schema';
import type { ChatMessageResponse } from '@/presentation/http/express/v1/schemas/chat-message/chat-message.response.schema';
import type { CursorPaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type { ConversationIdParamsSchema } from '@/presentation/http/express/v1/schemas/conversation/conversation.request.schema';

type ConversationIdParams = { params: typeof ConversationIdParamsSchema };
type SendMessageRequest = ValidatedRequest<ConversationIdParams & { body: typeof SendChatMessageBodySchema }>;
type ListMessagesRequest = ValidatedRequest<ConversationIdParams & { query: typeof CursorPaginationQuerySchema }>;
type MarkReadRequest = ValidatedRequest<ConversationIdParams & { body: typeof MarkChatReadBodySchema }>;

export interface IChatMessageController {
  sendMessage(req: SendMessageRequest): Promise<SuccessResponse<ChatMessageResponse>>;
  listMessages(req: ListMessagesRequest): Promise<unknown>;
  markRead(req: MarkReadRequest): Promise<unknown>;
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
  async sendMessage(req: SendMessageRequest) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = req.body;

    const message = await this.sendMessageUC.execute({
      userId,
      conversationId,
      text: body.text,
      attachments: body.attachments
    });

    return this.response<ChatMessageResponse>({
      instance: Created,
      data: message,
      message: 'Message sent'
    });
  }

  @AutoBind()
  async listMessages(req: ListMessagesRequest) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { conversationId } = req.params;

    const { items, nextCursor } = await this.listMessagesUC.execute({
      userId,
      conversationId,
      limit,
      cursor
    });

    return this.cursorPaginatedResponse<ChatMessageResponse>({
      items,
      nextCursor,
      message: 'Messages loaded'
    });
  }

  @AutoBind()
  async markRead(req: MarkReadRequest) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = req.body;

    await this.markReadUC.execute({ userId, conversationId, lastReadMessageId: body.lastReadMessageId });

    return this.response({ message: 'Read state updated' });
  }
}
