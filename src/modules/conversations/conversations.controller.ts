import { Injectable } from '@/decorators';
import {
  BaseController,
  ConversationIdParams,
  ConversationMemberParams,
  ConversationsService,
  CreateDirectConversationBodyDTO,
  CreateGroupConversationBodyDTO,
  InviteConversationMemberBodyDTO,
  PatchConversationBodyDTO,
  PatchConversationMemberRoleBodyDTO,
  TransferConversationAdminBodyDTO
} from '@/modules';
import { Created } from '@/providers';
import { CursorPaginationQueryDTO } from '@/shared';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IConversationsController {
  createDirect(req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>, res: Response): Promise<void>;
  createGroup(req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>, res: Response): Promise<void>;
  listConversations(
    req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: Response
  ): Promise<void>;
  getConversation(req: Request<ConversationIdParams>, res: Response): Promise<void>;
  patchConversation(req: Request<ConversationIdParams, object, PatchConversationBodyDTO>, res: Response): Promise<void>;
  inviteMember(
    req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>,
    res: Response
  ): Promise<void>;
  leaveConversation(req: Request<ConversationIdParams>, res: Response): Promise<void>;
  kickMember(req: Request<ConversationMemberParams>, res: Response): Promise<void>;
  patchMemberRole(
    req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>,
    res: Response
  ): Promise<void>;
  transferAdmin(
    req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>,
    res: Response
  ): Promise<void>;
}

@Injectable()
export class ConversationsController extends BaseController implements IConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {
    super();
  }

  createDirect = async (req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new CreateDirectConversationBodyDTO(req.body);
    const conv = await this.conversationsService.getOrCreateDirect(userId, body);
    this.sendResponse({ res, instance: Created, data: conv, message: 'Direct conversation ready' });
  };

  createGroup = async (req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new CreateGroupConversationBodyDTO(req.body);
    const conv = await this.conversationsService.createGroup(userId, body);
    this.sendResponse({ res, instance: Created, data: conv, message: 'Group conversation created' });
  };

  listConversations = async (
    req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: Response
  ) => {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { conversations, nextCursor } = await this.conversationsService.listConversations(
      userId,
      Number(limit),
      cursor
    );
    this.sendCursorPaginatedResponse({
      res,
      items: conversations,
      nextCursor,
      message: 'List conversations successfully'
    });
  };

  getConversation = async (req: Request<ConversationIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const detail = await this.conversationsService.getConversationDetail(userId, conversationId);
    this.sendResponse({ res, data: detail, message: 'Get conversation successfully' });
  };

  patchConversation = async (req: Request<ConversationIdParams, object, PatchConversationBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new PatchConversationBodyDTO(req.body);
    const conv = await this.conversationsService.patchConversation(userId, conversationId, body);
    this.sendResponse({ res, data: conv, message: 'Conversation updated' });
  };

  inviteMember = async (req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new InviteConversationMemberBodyDTO(req.body);
    const detail = await this.conversationsService.inviteMember(userId, conversationId, body);
    this.sendResponse({ res, data: detail, message: 'Member invited' });
  };

  kickMember = async (req: Request<ConversationMemberParams>, res: Response) => {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    await this.conversationsService.kickMember(userId, conversationId, userId);
    this.sendResponse({ res, data: null, message: 'Member removed' });
  };

  leaveConversation = async (req: Request<ConversationIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    await this.conversationsService.leaveConversation(userId, conversationId);
    this.sendResponse({ res, data: null, message: 'Left conversation' });
  };

  patchMemberRole = async (
    req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>,
    res: Response
  ) => {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new PatchConversationMemberRoleBodyDTO(req.body);
    const detail = await this.conversationsService.patchMemberRole(userId, conversationId, userId, body);
    this.sendResponse({ res, data: detail, message: 'Member role updated' });
  };

  transferAdmin = async (
    req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>,
    res: Response
  ) => {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new TransferConversationAdminBodyDTO(req.body);
    const detail = await this.conversationsService.transferAdmin(userId, conversationId, body);
    this.sendResponse({ res, data: detail, message: 'Admin transferred' });
  };
}
