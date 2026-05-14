import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import {
  CreateMemberInput,
  DeleteMemberInput,
  FindMemberInput,
  FindMembersByUsersInput,
  FindMembersInput,
  TransferAdminRoleInput,
  UpdateReadStateInput,
  UpdateRoleInput
} from '@/modules/conversation/domain/repositories/conversation-member.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface ConversationMemberRepositoryPort extends RepositoryPort<ConversationMemberEntity> {
  findMember(data: FindMemberInput): Promise<ConversationMemberEntity | null>;
  findMembersByUsers(data: FindMembersByUsersInput): Promise<ConversationMemberEntity[]>;
  findMembers(data: FindMembersInput): Promise<ConversationMemberEntity[]>;
  createMember(data: CreateMemberInput): Promise<ConversationMemberEntity>;
  deleteMember(data: DeleteMemberInput): Promise<number>;
  listMembers(conversationId: string): Promise<ConversationMemberEntity[]>;
  countAdmins(conversationId: string): Promise<number>;
  updateRole(data: UpdateRoleInput): Promise<ConversationMemberEntity | null>;
  transferAdminRole(data: TransferAdminRoleInput): Promise<void>;
  updateReadState(data: UpdateReadStateInput): Promise<ConversationMemberEntity | null>;
  countMembers(conversationId: string): Promise<number>;
}
