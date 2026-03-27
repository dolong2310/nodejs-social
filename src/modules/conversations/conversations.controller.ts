import {
  BaseController,
  ConversationIdParams,
  ConversationMemberParams,
  CreateDirectConversationBodyDTO,
  CreateGroupConversationBodyDTO,
  IConversationsService,
  InviteConversationMemberBodyDTO,
  PatchConversationBodyDTO,
  PatchConversationMemberRoleBodyDTO,
  TransferConversationAdminBodyDTO
} from '@/modules';
import { Created } from '@/providers';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IConversationsController {
  createDirect(req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>, res: Response): Promise<void>;
  createGroup(req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>, res: Response): Promise<void>;
  listConversations(req: Request, res: Response): Promise<void>;
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

export class ConversationsController extends BaseController implements IConversationsController {
  constructor(private readonly conversationsService: IConversationsService) {
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

  listConversations = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const { conversations, nextCursor } = await this.conversationsService.listConversations(userId, limit, cursor);
    this.sendResponse({
      res,
      data: { conversations, nextCursor },
      message: 'List conversations successfully'
    });
  };

  getConversation = async (req: Request<ConversationIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    const detail = await this.conversationsService.getConversationDetail(userId, req.params.conversationId);
    this.sendResponse({ res, data: detail, message: 'Get conversation successfully' });
  };

  patchConversation = async (req: Request<ConversationIdParams, object, PatchConversationBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new PatchConversationBodyDTO(req.body);
    const conv = await this.conversationsService.patchConversation(userId, req.params.conversationId, body);
    this.sendResponse({ res, data: conv, message: 'Conversation updated' });
  };

  inviteMember = async (req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new InviteConversationMemberBodyDTO(req.body);
    const detail = await this.conversationsService.inviteMember(userId, req.params.conversationId, body);
    this.sendResponse({ res, data: detail, message: 'Member invited' });
  };

  leaveConversation = async (req: Request<ConversationIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    await this.conversationsService.leaveConversation(userId, req.params.conversationId);
    this.sendResponse({ res, data: null, message: 'Left conversation' });
  };

  kickMember = async (req: Request<ConversationMemberParams>, res: Response) => {
    const userId = this.getUserId(req);
    await this.conversationsService.kickMember(userId, req.params.conversationId, req.params.userId);
    this.sendResponse({ res, data: null, message: 'Member removed' });
  };

  patchMemberRole = async (
    req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>,
    res: Response
  ) => {
    const userId = this.getUserId(req);
    const body = new PatchConversationMemberRoleBodyDTO(req.body);
    const detail = await this.conversationsService.patchMemberRole(
      userId,
      req.params.conversationId,
      req.params.userId,
      body
    );
    this.sendResponse({ res, data: detail, message: 'Member role updated' });
  };

  transferAdmin = async (
    req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>,
    res: Response
  ) => {
    const userId = this.getUserId(req);
    const body = new TransferConversationAdminBodyDTO(req.body);
    const detail = await this.conversationsService.transferAdmin(userId, req.params.conversationId, body);
    this.sendResponse({ res, data: detail, message: 'Admin transferred' });
  };
}
