import {
  CreateGroupConversationPayloadDTO,
  GetConversationDetailPayloadDTO,
  GetOrCreateDirectPayloadDTO,
  InviteConversationMemberPayloadDTO,
  KickMemberPayloadDTO,
  LeaveConversationPayloadDTO,
  ListConversationsPayloadDTO,
  PatchConversationMemberRolePayloadDTO,
  PatchConversationPayloadDTO,
  TransferConversationAdminPayloadDTO
} from '@/application/dtos/conversation/conversation.payload.dto';
import {
  ConversationDetailResultDTO,
  ConversationResultDTO,
  ConversationsPaginationResultDTO
} from '@/application/dtos/conversation/conversation.result.dto';

export interface IConversationsService {
  getOrCreateDirect(payload: GetOrCreateDirectPayloadDTO): Promise<ConversationResultDTO>;
  createGroup(payload: CreateGroupConversationPayloadDTO): Promise<ConversationResultDTO>;
  listConversations(payload: ListConversationsPayloadDTO): Promise<ConversationsPaginationResultDTO>;
  getConversationDetail(payload: GetConversationDetailPayloadDTO): Promise<ConversationDetailResultDTO>;
  patchConversation(payload: PatchConversationPayloadDTO): Promise<ConversationResultDTO>;
  inviteMember(payload: InviteConversationMemberPayloadDTO): Promise<ConversationDetailResultDTO>;
  leaveConversation(payload: LeaveConversationPayloadDTO): Promise<void>;
  kickMember(payload: KickMemberPayloadDTO): Promise<void>;
  patchMemberRole(payload: PatchConversationMemberRolePayloadDTO): Promise<ConversationDetailResultDTO>;
  transferAdmin(payload: TransferConversationAdminPayloadDTO): Promise<ConversationDetailResultDTO>;
}
