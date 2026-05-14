import {
  CreateGroupConversationProps,
  EnumConversationType
} from '@/modules/conversation/domain/entities/conversation.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class CreateGroupCommand {
  userId: string;
  name?: string;
  memberIds: string[];
  constructor(payload: { userId: string; name?: string; memberIds: string[] }) {
    this.userId = payload.userId;
    this.name = payload.name;
    this.memberIds = payload.memberIds ?? [];
  }
}

export class CreateGroupResult implements CreateGroupConversationProps {
  id: string;
  type: EnumConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  updatedAt: Date;
  createdAt: Date;
  constructor(payload: {
    id: string;
    type: EnumConversationType;
    createdBy: string;
    name?: string;
    avatarMediaId?: string | null;
    updatedAt: Date;
    createdAt: Date;
  }) {
    this.id = payload.id;
    this.type = payload.type;
    this.createdBy = payload.createdBy;
    this.name = payload.name;
    this.avatarMediaId = payload.avatarMediaId;
    this.updatedAt = payload.updatedAt;
    this.createdAt = payload.createdAt;
  }
}

export abstract class CreateGroupPort implements UseCase<CreateGroupCommand, CreateGroupResult> {
  abstract execute(command: CreateGroupCommand): Promise<CreateGroupResult>;
}
