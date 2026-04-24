import { EConversationMemberRole } from '@/domain/entities/conversation-member/conversation-member.type';
import { isValidId } from '@/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { validate } from '@/presentation/http/utils/validation.util';
import { IUserValidator } from '@/presentation/http/validators/user.validator';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface IConversationValidator {
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

export class ConversationsValidator implements IConversationValidator {
  constructor(private readonly userValidator: IUserValidator) {}

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
            options: (id: string) => isValidId(id),
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_CONVERSATION_ID
          }
        }
      },
      ['params']
    )
  );

  @AutoBind()
  kickTargetUserIdParam() {
    return this.userValidator.userIdValidator('userId', 'params');
  }

  @AutoBind()
  peerUserIdBody() {
    return this.userValidator.userIdValidator('peerUserId', 'body');
  }

  @AutoBind()
  inviteUserIdBody() {
    return this.userValidator.userIdValidator('userId', 'body');
  }

  @AutoBind()
  newAdminUserIdBody() {
    return this.userValidator.userIdValidator('newAdminUserId', 'body');
  }

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
            options: (id: string) => isValidId(id),
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
