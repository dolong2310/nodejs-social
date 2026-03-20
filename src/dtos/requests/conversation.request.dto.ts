import { PaginationQueryDTO } from '@/dtos/requests/common.request.dto';
import { ParamsDictionary } from 'express-serve-static-core';

export interface GetConversationsParamsDTO extends ParamsDictionary {
  receiverId: string;
}

export interface GetConversationsQueryDTO extends PaginationQueryDTO {}
