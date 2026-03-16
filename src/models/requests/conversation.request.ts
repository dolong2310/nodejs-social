import { IPaginationRequestQuery } from '@/models/requests/common.request';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IGetConversationsRequestParams extends ParamsDictionary {
  receiverId: string;
}

export interface IGetConversationsRequestQuery extends IPaginationRequestQuery {}
