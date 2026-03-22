import { BaseController } from '@/controllers/base.controller';
import {
  CreateDirectChatBodyDTO,
  CreateGroupChatBodyDTO,
  InviteChatMemberBodyDTO,
  PatchChatBodyDTO,
  PatchChatMemberRoleBodyDTO,
  TransferChatAdminBodyDTO
} from '@/dtos/requests/chat.request.dto';
import { Created } from '@/responses/success.response';
import { IChatsService } from '@/services/chats.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ChatIdParams extends ParamsDictionary {
  chatId: string;
}

export interface ChatMemberParams extends ChatIdParams {
  userId: string;
}

export interface IChatsController {
  createDirect(req: Request<ParamsDictionary, object, CreateDirectChatBodyDTO>, res: Response): Promise<void>;
  createGroup(req: Request<ParamsDictionary, object, CreateGroupChatBodyDTO>, res: Response): Promise<void>;
  listChats(req: Request, res: Response): Promise<void>;
  getChat(req: Request<ChatIdParams>, res: Response): Promise<void>;
  patchChat(req: Request<ChatIdParams, object, PatchChatBodyDTO>, res: Response): Promise<void>;
  inviteMember(req: Request<ChatIdParams, object, InviteChatMemberBodyDTO>, res: Response): Promise<void>;
  leaveChat(req: Request<ChatIdParams>, res: Response): Promise<void>;
  kickMember(req: Request<ChatMemberParams>, res: Response): Promise<void>;
  patchMemberRole(
    req: Request<ChatMemberParams, object, PatchChatMemberRoleBodyDTO>,
    res: Response
  ): Promise<void>;
  transferAdmin(req: Request<ChatIdParams, object, TransferChatAdminBodyDTO>, res: Response): Promise<void>;
}

class ChatsController extends BaseController implements IChatsController {
  constructor(private readonly chatsService: IChatsService) {
    super();
  }

  createDirect = async (req: Request<ParamsDictionary, object, CreateDirectChatBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new CreateDirectChatBodyDTO(req.body);
    const chat = await this.chatsService.getOrCreateDirect(userId, body);
    this.sendResponse({ res, instance: Created, data: chat, message: 'Direct chat ready' });
  };

  createGroup = async (req: Request<ParamsDictionary, object, CreateGroupChatBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new CreateGroupChatBodyDTO(req.body);
    const chat = await this.chatsService.createGroup(userId, body);
    this.sendResponse({ res, instance: Created, data: chat, message: 'Group chat created' });
  };

  listChats = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const { chats, nextCursor } = await this.chatsService.listChats(userId, limit, cursor);
    this.sendResponse({
      res,
      data: { chats, nextCursor },
      message: 'List chats successfully'
    });
  };

  getChat = async (req: Request<ChatIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    const detail = await this.chatsService.getChatDetail(userId, req.params.chatId);
    this.sendResponse({ res, data: detail, message: 'Get chat successfully' });
  };

  patchChat = async (req: Request<ChatIdParams, object, PatchChatBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new PatchChatBodyDTO(req.body);
    const chat = await this.chatsService.patchChat(userId, req.params.chatId, body);
    this.sendResponse({ res, data: chat, message: 'Chat updated' });
  };

  inviteMember = async (req: Request<ChatIdParams, object, InviteChatMemberBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new InviteChatMemberBodyDTO(req.body);
    const detail = await this.chatsService.inviteMember(userId, req.params.chatId, body);
    this.sendResponse({ res, data: detail, message: 'Member invited' });
  };

  leaveChat = async (req: Request<ChatIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    await this.chatsService.leaveChat(userId, req.params.chatId);
    this.sendResponse({ res, data: null, message: 'Left chat' });
  };

  kickMember = async (req: Request<ChatMemberParams>, res: Response) => {
    const userId = this.getUserId(req);
    await this.chatsService.kickMember(userId, req.params.chatId, req.params.userId);
    this.sendResponse({ res, data: null, message: 'Member removed' });
  };

  patchMemberRole = async (req: Request<ChatMemberParams, object, PatchChatMemberRoleBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new PatchChatMemberRoleBodyDTO(req.body);
    const detail = await this.chatsService.patchMemberRole(userId, req.params.chatId, req.params.userId, body);
    this.sendResponse({ res, data: detail, message: 'Member role updated' });
  };

  transferAdmin = async (req: Request<ChatIdParams, object, TransferChatAdminBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new TransferChatAdminBodyDTO(req.body);
    const detail = await this.chatsService.transferAdmin(userId, req.params.chatId, body);
    this.sendResponse({ res, data: detail, message: 'Admin transferred' });
  };
}

export default ChatsController;
