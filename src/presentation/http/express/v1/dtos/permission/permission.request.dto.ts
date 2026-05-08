import { EHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import { ParamsDictionary } from 'express-serve-static-core';

export class CreatePermissionBodyDTO {
  name: string;
  description: string;
  path: string;
  method: EHttpMethod;
  module: string;

  constructor(body: { name: string; description: string; path: string; method: EHttpMethod; module: string }) {
    this.name = body.name;
    this.description = body.description;
    this.path = body.path;
    this.method = body.method;
    this.module = body.module;
  }
}

export class UpdatePermissionBodyDTO {
  name?: string;
  description?: string;
  path?: string;
  method?: EHttpMethod;
  module?: string;

  constructor(body: { name?: string; description?: string; path?: string; method?: EHttpMethod; module?: string }) {
    this.name = body.name;
    this.description = body.description;
    this.path = body.path;
    this.method = body.method;
    this.module = body.module;
  }
}

export interface PermissionIdParamsDTO extends ParamsDictionary {
  permissionId: string;
}
