import type { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.types';
import type { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.types';
import type { UseCase } from '@/modules/core/application/base.usecase';

export interface CheckRouteAccessProps {
  roleId: string;
  method: EnumHttpMethod;
  path: string;
}

export class CheckRouteAccessInputPort implements CheckRouteAccessProps {
  roleId: string;
  method: EnumHttpMethod;
  path: string;

  constructor(payload: CheckRouteAccessProps) {
    this.roleId = payload.roleId;
    this.method = payload.method;
    this.path = payload.path;
  }
}

/** Returns the role when it may access the route, or null when access is denied. */
export abstract class CheckRouteAccessPort implements UseCase<CheckRouteAccessInputPort, RoleWithPermissions | null> {
  abstract execute(input: CheckRouteAccessInputPort): Promise<RoleWithPermissions | null>;
}
