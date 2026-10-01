import { EnumUserStatus, UserFullProps, UserSafeProps } from '@/modules/user/domain/entities/user.types';
import { UserWithRole } from '@/modules/user/domain/repositories/user.query.types';
import { makeRoleFullProps } from './role.builder';

export function makeUserFullProps(overrides: Partial<UserFullProps> = {}): UserFullProps {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'user_1',
    name: 'Long Do',
    email: 'long@example.com',
    password: 'hashed-password',
    birthday: new Date('1995-01-01T00:00:00.000Z'),
    roleId: 'role_user',
    status: EnumUserStatus.ACTIVE,
    username: 'longdo',
    createdAt: now,
    createdById: null,
    updatedAt: now,
    updatedById: null,
    deletedAt: null,
    deletedById: null,
    ...overrides
  };
}

export function makeUserSafeProps(overrides: Partial<UserSafeProps> = {}): UserSafeProps {
  const { password, totpSecret, ...safe } = makeUserFullProps(overrides);
  void password;
  void totpSecret;
  return safe;
}

export function makeUserWithRole(overrides: Partial<UserWithRole> = {}): UserWithRole {
  const role = makeRoleFullProps(overrides.role ? overrides.role : undefined);
  return {
    ...makeUserFullProps(overrides),
    role
  };
}
