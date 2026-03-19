import { IPaginationResponse } from '@/models/responses/common.response';
import { IConversation } from '@/models/schemas/conversation.schema';

export interface IConversationResponse extends IPaginationResponse {
  data: IConversation[];
}
