import {
  permissionKey,
  type RoleAccessServicePort
} from '@/modules/authorization/application/services/role-access.service';
import {
  type CheckRouteAccessInputPort,
  CheckRouteAccessPort
} from '@/modules/authorization/application/use-cases/check-route-access/check-route-access.port';
import type { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.types';
import { omit } from 'lodash-es';

/**
 * Role-based access control: a role may access a route only when it exists, is active,
 * and holds the permission for the route's method and path.
 */
export class CheckRouteAccessUseCase extends CheckRouteAccessPort {
  constructor(private readonly roleAccessService: RoleAccessServicePort) {
    super();
  }

  async execute(input: CheckRouteAccessInputPort): Promise<RoleWithPermissions | null> {
    const { roleId, method, path } = input;
    const roleAccess = await this.roleAccessService.getRoleAccess(roleId);

    if (!roleAccess?.isActive) return null;
    if (!roleAccess.permissionsMap[permissionKey(method, path)]) return null;

    return omit(roleAccess, ['permissionsMap']);
  }
}
