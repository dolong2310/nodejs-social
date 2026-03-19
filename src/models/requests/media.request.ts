import { ParamsDictionary } from 'express-serve-static-core';

export interface IFilenameRequestParams extends ParamsDictionary {
  filename: string;
}

export interface IVideoHLSRequestParams extends ParamsDictionary {
  id: string;
  version: string;
  segment: string;
}
