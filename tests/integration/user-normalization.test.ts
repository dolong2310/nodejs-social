import { UpdateMeCommand } from '@/modules/user/application/use-cases/update-me/update-me.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { normalizeUserEmail, normalizeUsername } from '@/modules/user/domain/helpers/user-normalization.helper';
import { describe, expect, it } from 'vitest';

describe('user identity normalization', () => {
  it('normalizes email and username before persistence-facing user props are exposed', () => {
    const user = UserEntity.create({
      name: 'Jane Doe',
      email: '  Foo@Example.COM  ',
      password: 'hashed-password',
      birthday: new Date('1990-01-01T00:00:00.000Z'),
      roleId: 'role-user',
      status: EnumUserStatus.ACTIVE,
      username: '  Jane_DOE  '
    });

    expect(user.getProps().email).toBe('foo@example.com');
    expect(user.getProps().username).toBe('jane_doe');
  });

  it('normalizes lookup/update identity inputs consistently', () => {
    const command = new UpdateMeCommand({
      userId: 'user_123',
      username: '  Mixed_CASE  '
    });

    expect(normalizeUserEmail('  Foo@Example.COM  ')).toBe('foo@example.com');
    expect(normalizeUsername('  Mixed_CASE  ')).toBe('mixed_case');
    expect(command.username).toBe('mixed_case');
  });
});
