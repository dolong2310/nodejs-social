import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { EConversationMemberRole, IUsersValidation } from '@/modules';
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

export class ConversationsValidation implements IConversationsValidation {
  constructor(private readonly usersValidation: IUsersValidation) {}

  conversationIdParam = validate(
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

  kickTargetUserIdParam = () => this.usersValidation.userIdValidation('userId', 'params');
  peerUserIdBody = () => this.usersValidation.userIdValidation('peerUserId', 'body');
  inviteUserIdBody = () => this.usersValidation.userIdValidation('userId', 'body');
  newAdminUserIdBody = () => this.usersValidation.userIdValidation('newAdminUserId', 'body');

  createGroupBody = validate(
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

  patchConversationBody = validate(
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
            errorMessage: VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN
          }
        }
      },
      ['body']
    )
  );

}
