import { PaginationResponseDTO } from '@/dtos/responses/common.response.dto';
import { IConversation } from '@/models/schemas/conversation.schema';

export interface ConversationResponseDTO extends PaginationResponseDTO {
  data: IConversation[];
}
