import { EnumRoleName } from '@/modules/authorization/domain/entities/role.type';
import { RoleFullProps } from '@/modules/user/domain/repositories/user.query.type';

export function makeRoleFullProps(overrides: Partial<RoleFullProps> = {}): RoleFullProps {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'role_user',
    name: EnumRoleName.USER,
    description: '',
    isActive: true,
    permissionIds: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    createdById: null,
    updatedById: null,
    deletedById: null,
    ...overrides
  };
}
