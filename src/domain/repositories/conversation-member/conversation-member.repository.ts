import { IConversationMember } from '@/domain/entities/conversation-member.entity';
import {
  ICountAdminsInput,
  ICountMembersInput,
  ICreateMemberInput,
  IDeleteMemberInput,
  IFindMemberInput,
  IFindMembersByUsersInput,
  IFindMembersInput,
  IListConversationsForUserInput,
  IListConversationsForUserOutput,
  IListMembersInput,
  ITransferAdminRoleInput,
  IUpdateReadStateInput,
  IUpdateRoleInput
} from '@/domain/repositories/conversation-member/conversation-member.interface';

export interface IConversationMemberRepository {
  findMember(data: IFindMemberInput): Promise<IConversationMember | null>;
  findMembersByUsers(data: IFindMembersByUsersInput): Promise<IConversationMember[]>;
  findMembers(data: IFindMembersInput): Promise<IConversationMember[]>;
  createMember(data: ICreateMemberInput): Promise<IConversationMember>;
  deleteMember(data: IDeleteMemberInput): Promise<number>;
  listMembers(data: IListMembersInput): Promise<IConversationMember[]>;
  countAdmins(data: ICountAdminsInput): Promise<number>;
  updateRole(data: IUpdateRoleInput): Promise<IConversationMember | null>;
  transferAdminRole(data: ITransferAdminRoleInput): Promise<void>;
  updateReadState(data: IUpdateReadStateInput): Promise<IConversationMember | null>;
  countMembers(data: ICountMembersInput): Promise<number>;
  listConversationsForUser(data: IListConversationsForUserInput): Promise<IListConversationsForUserOutput[]>;
}
