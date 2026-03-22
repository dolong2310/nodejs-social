import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { EChatMemberRole } from '@/models/schemas/chatMember.schema';
import { isValidMongoId } from '@/utils/common.util';
import { validate } from '@/utils/validation.util';
import { IUsersValidation } from '@/validations/users.validation';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface IChatsValidation {
  chatIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  peerUserIdBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  createGroupBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  patchChatBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  inviteUserIdBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  patchMemberRoleBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  newAdminUserIdBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  sendMessageBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  markReadBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  listChatsQuery: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  listMessagesQuery: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  kickTargetUserIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

const roleValues = [EChatMemberRole.MANAGER, EChatMemberRole.MEMBER];

class ChatsValidation implements IChatsValidation {
  chatIdParam!: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  kickTargetUserIdParam!: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  peerUserIdBody!: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  inviteUserIdBody!: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  newAdminUserIdBody!: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;

  createGroupBody = validate(
    checkSchema(
      {
        name: { optional: true, isString: true, trim: true },
        memberIds: {
          isArray: { bail: true, errorMessage: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY },
          custom: {
            options: (v: unknown) => Array.isArray(v) && v.length >= 1,
            errorMessage: VALIDATION_ERROR_MESSAGE.CHAT_GROUP_NEEDS_MEMBER
          }
        },
        'memberIds.*': {
          isString: true,
          trim: true,
          custom: {
            options: (id: string) => isValidMongoId(id),
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_USER_ID
          }
        }
      },
      ['body']
    )
  );

  patchChatBody = validate(
    checkSchema(
      {
        name: { optional: true, isString: true, trim: true },
        avatarMediaId: { optional: true }
      },
      ['body']
    )
  );

  patchMemberRoleBody = validate(
    checkSchema(
      {
        role: {
          isIn: {
            options: [roleValues],
            errorMessage: VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN
          }
        }
      },
      ['body']
    )
  );

  sendMessageBody = validate(
    checkSchema(
      {
        text: { optional: true, isString: true },
        attachments: { optional: true, isArray: true }
      },
      ['body']
    )
  );

  markReadBody = validate(
    checkSchema(
      {
        lastReadMessageId: { optional: true, isString: true, trim: true }
      },
      ['body']
    )
  );

  listChatsQuery = validate(
    checkSchema(
      {
        limit: { optional: true, isInt: { options: { min: 1, max: 100 } } },
        cursor: { optional: true, isString: true }
      },
      ['query']
    )
  );

  listMessagesQuery = validate(
    checkSchema(
      {
        limit: { optional: true, isInt: { options: { min: 1, max: 100 } } },
        cursor: { optional: true, isString: true }
      },
      ['query']
    )
  );

  constructor(usersValidation: IUsersValidation) {
    this.chatIdParam = usersValidation.userIdValidation('chatId', 'params');
    this.kickTargetUserIdParam = usersValidation.userIdValidation('userId', 'params');
    this.peerUserIdBody = usersValidation.userIdValidation('peerUserId', 'body');
    this.inviteUserIdBody = usersValidation.userIdValidation('userId', 'body');
    this.newAdminUserIdBody = usersValidation.userIdValidation('newAdminUserId', 'body');
  }
}

export default ChatsValidation;
