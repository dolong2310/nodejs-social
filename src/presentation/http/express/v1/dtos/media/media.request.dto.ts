import { ParamsDictionary } from 'express-serve-static-core';

export interface FilenameParamsDTO extends ParamsDictionary {
  filename: string;
}

export interface VideoStreamParamsDTO extends ParamsDictionary {
  id: string;
  version: string;
  segment: string;
}
