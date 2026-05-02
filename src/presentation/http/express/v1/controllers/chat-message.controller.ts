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
import { Request, Response } from 'express';

export interface IChatMessageController {
  sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response): Promise<void>;
  listMessages(
    req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>,
    res: Response
  ): Promise<void>;
  markRead(req: Request<ConversationIdParams, object, MarkChatReadBodyDTO>, res: Response): Promise<void>;
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
  async sendMessage(req: Request<ConversationIdParams, object, SendChatMessageBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new SendChatMessageBodyDTO(req.body);

    const message = await this.sendMessageUC.execute({
      userId,
      conversationId,
      text: body.text,
      attachments: body.attachments
    });

    this.sendResponse<ChatMessageResponseDTO>({
      res,
      instance: Created,
      data: new ChatMessageResponseDTO(message),
      message: 'Message sent'
    });
  }

  @AutoBind()
  async listMessages(req: Request<ConversationIdParams, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { conversationId } = req.params;

    const { items, nextCursor } = await this.listMessagesUC.execute({
      userId,
      conversationId,
      limit: Number(limit),
      cursor
    });

    this.sendCursorPaginatedResponse<ChatMessageResponseDTO>({
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

    await this.markReadUC.execute({ userId, conversationId, lastReadMessageId: body.lastReadMessageId });

    this.sendResponse({ res, message: 'Read state updated' });
  }
}
