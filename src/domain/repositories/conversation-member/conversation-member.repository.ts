import { ConversationMemberEntity } from '@/domain/entities/conversation-member/conversation-member.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICreateMemberInput,
  IDeleteMemberInput,
  IFindMemberInput,
  IFindMembersByUsersInput,
  IFindMembersInput,
  ITransferAdminRoleInput,
  IUpdateReadStateInput,
  IUpdateRoleInput
} from '@/domain/repositories/conversation-member/conversation-member.repository.type';

export interface ConversationMemberRepositoryPort extends RepositoryPort<ConversationMemberEntity> {
  findMember(data: IFindMemberInput): Promise<ConversationMemberEntity | null>;
  findMembersByUsers(data: IFindMembersByUsersInput): Promise<ConversationMemberEntity[]>;
  findMembers(data: IFindMembersInput): Promise<ConversationMemberEntity[]>;
  createMember(data: ICreateMemberInput): Promise<ConversationMemberEntity>;
  deleteMember(data: IDeleteMemberInput): Promise<number>;
  listMembers(conversationId: string): Promise<ConversationMemberEntity[]>;
  countAdmins(conversationId: string): Promise<number>;
  updateRole(data: IUpdateRoleInput): Promise<ConversationMemberEntity | null>;
  transferAdminRole(data: ITransferAdminRoleInput): Promise<void>;
  updateReadState(data: IUpdateReadStateInput): Promise<ConversationMemberEntity | null>;
  countMembers(conversationId: string): Promise<number>;
}
