import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { AutoBind, Injectable } from '@/decorators';
import { EConversationMemberRole, UsersValidation } from '@/modules';
import { isValidMongoId, validate } from '@/utils';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface IConversationsValidation {
  conversationIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  peerUserIdBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  createGroupBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  patchConversationBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  inviteUserIdBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  patchMemberRoleBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  newAdminUserIdBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  kickTargetUserIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

const roleValues = [EConversationMemberRole.MANAGER, EConversationMemberRole.MEMBER];

@Injectable()
export class ConversationsValidation implements IConversationsValidation {
  constructor(private readonly usersValidation: UsersValidation) {}

  @AutoBind()
  conversationIdParam() {
    return validate(
      checkSchema(
        {
          conversationId: {
            notEmpty: {
              errorMessage: VALIDATION_ERROR_MESSAGE.CONVERSATION_ID_IS_REQUIRED
            },
            isString: {
              errorMessage: VALIDATION_ERROR_MESSAGE.CONVERSATION_ID_MUST_BE_A_STRING
            },
            trim: true,
            custom: {
              options: (id: string) => isValidMongoId(id),
              errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_CONVERSATION_ID
            }
          }
        },
        ['params']
      )
    );
  }

  @AutoBind()
  kickTargetUserIdParam() {
    return this.usersValidation.userIdValidation('userId', 'params');
  }

  @AutoBind()
  peerUserIdBody() {
    return this.usersValidation.userIdValidation('peerUserId', 'body');
  }

  @AutoBind()
  inviteUserIdBody() {
    return this.usersValidation.userIdValidation('userId', 'body');
  }

  @AutoBind()
  newAdminUserIdBody() {
    return this.usersValidation.userIdValidation('newAdminUserId', 'body');
  }

  @AutoBind()
  createGroupBody() {
    return validate(
      checkSchema(
        {
          name: { optional: true, isString: true, trim: true },
          memberIds: {
            isArray: { bail: true, errorMessage: VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY },
            custom: {
              options: (v: unknown) => Array.isArray(v) && v.length >= 1,
              errorMessage: VALIDATION_ERROR_MESSAGE.CONVERSATION_GROUP_NEEDS_MEMBER
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
  }

  @AutoBind()
  patchConversationBody() {
    return validate(
      checkSchema(
        {
          name: { optional: true, isString: true, trim: true },
          avatarMediaId: { optional: true }
        },
        ['body']
      )
    );
  }

  @AutoBind()
  patchMemberRoleBody() {
    return validate(
      checkSchema(
        {
          role: {
            isIn: {
              options: [roleValues],
              errorMessage: VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN
            }
          }
        },
        ['body']
      )
    );
  }
}
