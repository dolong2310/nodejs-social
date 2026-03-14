import { ESearchPeopleFollow, ESearchType } from '@/enums/search.enum';
import { IPaginationRequestQuery } from '@/models/requests/common.request';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface ISearchRequestParams extends ParamsDictionary {}

export interface ISearchRequestQuery extends Query, IPaginationRequestQuery {
  query: string;
  type?: ESearchType;
  people_follow?: ESearchPeopleFollow;
}
