import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { RequestHandlerType } from '@/presentation/http/express/middlewares/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';
import { checkSchema } from 'express-validator';

export interface IConversationValidator {
  conversationIdParam: RequestHandlerType;
  peerUserIdBody: RequestHandlerType;
  createGroupBody: RequestHandlerType;
  patchConversationBody: RequestHandlerType;
  inviteUserIdBody: RequestHandlerType;
  patchMemberRoleBody: RequestHandlerType;
  newAdminUserIdBody: RequestHandlerType;
  kickTargetUserIdParam: RequestHandlerType;
}

const roleValues = [EConversationMemberRole.MANAGER, EConversationMemberRole.MEMBER];

export class ConversationsValidator implements IConversationValidator {
  kickTargetUserIdParam: RequestHandlerType;
  peerUserIdBody: RequestHandlerType;
  inviteUserIdBody: RequestHandlerType;
  newAdminUserIdBody: RequestHandlerType;

  constructor(private readonly userValidator: IUserValidator) {
    this.kickTargetUserIdParam = this.userValidator.userIdValidator('userId', 'params');
    this.peerUserIdBody = this.userValidator.userIdValidator('peerUserId', 'body');
    this.inviteUserIdBody = this.userValidator.userIdValidator('userId', 'body');
    this.newAdminUserIdBody = this.userValidator.userIdValidator('newAdminUserId', 'body');
  }

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
