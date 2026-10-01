import { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import { createExpressApp } from '@/presentation/http/express/app';
import type { IContainer } from '@/bootstrap/container';
import type { IAppConfig } from '@/bootstrap/types/app.type';
import type { OtpEmailJobData, OtpEmailQueuePort } from '@/modules/authentication/application/ports/otp-email-job.port';
import type { TwoFactorAuthPort } from '@/modules/authentication/application/ports/2fa.port';
import { AuthService } from '@/modules/authentication/application/services/auth.service';
import { OtpService } from '@/modules/authentication/application/services/otp.service';
import { TokenService } from '@/modules/authentication/application/services/token.service';
import { Disable2FAUseCase } from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.usecase';
import { ForgotPasswordUseCase } from '@/modules/authentication/application/use-cases/forgot-password/forgot-password.usecase';
import { LoginEmailUseCase } from '@/modules/authentication/application/use-cases/login-email/login-email.usecase';
import { LogoutUseCase } from '@/modules/authentication/application/use-cases/logout/logout.usecase';
import { RefreshTokenUseCase } from '@/modules/authentication/application/use-cases/refresh-token/refresh-token.usecase';
import { RegisterUseCase } from '@/modules/authentication/application/use-cases/register/register.usecase';
import { SendOtpUseCase } from '@/modules/authentication/application/use-cases/send-otp/send-otp.usecase';
import { Setup2FAUseCase } from '@/modules/authentication/application/use-cases/setup-2fa/setup-2fa.usecase';
import type { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import type { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import { RefreshTokenEntity } from '@/modules/authentication/domain/entities/refresh-token.entity';
import { JwtService } from '@/modules/authentication/infrastructure/services/jwt.service';
import { HashingService } from '@/modules/authentication/infrastructure/services/hashing.service';
import { RoleService } from '@/modules/authorization/application/services/role.service';
import { EnumHttpMethod, type PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { EnumRoleName, type RoleFullProps } from '@/modules/authorization/domain/entities/role.type';
import type { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import type { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.type';
import type { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Paginated, type PaginatedQueryParams } from '@/modules/core/domain/repositories/port.repository';
import type { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { UserService } from '@/modules/user/application/services/user.service';
import { AdminCreateUserUseCase } from '@/modules/user/application/use-cases/admin-create-user/admin-create-user.usecase';
import { AdminDeleteUserUseCase } from '@/modules/user/application/use-cases/admin-delete-user/admin-delete-user.usecase';
import { AdminGetUserUseCase } from '@/modules/user/application/use-cases/admin-get-user/admin-get-user.usecase';
import { AdminListUsersUseCase } from '@/modules/user/application/use-cases/admin-list-users/admin-list-users.usecase';
import { AdminUpdateUserUseCase } from '@/modules/user/application/use-cases/admin-update-user/admin-update-user.usecase';
import { ChangePasswordUseCase } from '@/modules/user/application/use-cases/change-password/change-password.usecase';
import { GetMeUseCase } from '@/modules/user/application/use-cases/get-me/get-me.usecase';
import { GetUserProfileUseCase } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.usecase';
import { UpdateMeUseCase } from '@/modules/user/application/use-cases/update-me/update-me.usecase';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { EnumUserStatus, type UserFullProps, type UserSafeProps } from '@/modules/user/domain/entities/user.type';
import type { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import type { FindUsersForSearchInput, UserWithRole } from '@/modules/user/domain/repositories/user.query.type';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import type {
  ChangePasswordInput,
  ResetPasswordInput,
  UpdateMeInput
} from '@/modules/user/domain/repositories/user.repository.type';
import { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { AdminUserController } from '@/presentation/http/express/v1/controllers/admin-user.controller';
import { AuthController } from '@/presentation/http/express/v1/controllers/auth.controller';
import { UserController } from '@/presentation/http/express/v1/controllers/user.controller';
import { AdminUsersPipe } from '@/presentation/http/express/v1/pipes/admin-user.pipe';
import { AuthPipe } from '@/presentation/http/express/v1/pipes/auth.pipe';
import { PaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { UsersPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { AdminUserRoute } from '@/presentation/http/express/v1/routes/admin-user.route';
import { AuthRoute } from '@/presentation/http/express/v1/routes/auth.route';
import { UserRoute } from '@/presentation/http/express/v1/routes/user.route';
import type { Express } from 'express';
import bcrypt from 'bcrypt';

type StoredUserPatch = Partial<UserFullProps> & { totpSecret?: string | null };

const apiKey = 'test-api-key';

const logger: LoggerPort = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  child: () => logger
};

class MemoryCacheManager implements CacheManagerPort {
  private readonly values = new Map<string, unknown>();
  private readonly locks = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }

  async del(...keys: string[]): Promise<void> {
    keys.forEach((key) => this.values.delete(key));
  }

  async clear(): Promise<void> {
    this.values.clear();
    this.locks.clear();
  }

  async acquireLock(key: string): Promise<{ token: string } | null> {
    if (this.locks.has(key)) return null;
    const token = `${key}:token`;
    this.locks.set(key, token);
    return { token };
  }

  async releaseLock(key: string, token: string): Promise<void> {
    if (this.locks.get(key) === token) this.locks.delete(key);
  }

  async read<T>(key: string, loader: () => Promise<T | null>): Promise<T | null> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await loader();
    if (value !== null) await this.set(key, value);
    return value;
  }

  async write<T>(key: string, writer: () => Promise<T>): Promise<T> {
    const value = await writer();
    await this.set(key, value);
    return value;
  }

  async delete(key: string, deleter: () => Promise<void>): Promise<void> {
    await deleter();
    await this.del(key);
  }

  async invalidate(key: string): Promise<void> {
    await this.del(key);
  }
}

class MemoryRoleRepository implements RoleRepositoryPort {
  private readonly roles = new Map<string, RoleEntity>();

  constructor() {
    this.save(RoleEntity.create({ name: EnumRoleName.ADMIN, description: 'Admin', isActive: true }));
    this.save(RoleEntity.create({ name: EnumRoleName.USER, description: 'User', isActive: true }));
  }

  get adminRoleId(): string {
    return this.findRoleByNameSync(EnumRoleName.ADMIN).id.toString();
  }

  get userRoleId(): string {
    return this.findRoleByNameSync(EnumRoleName.USER).id.toString();
  }

  async findRoleById(id: string): Promise<RoleEntity | null> {
    return this.roles.get(id) ?? null;
  }

  async findRoleByName(name: string): Promise<RoleEntity | null> {
    return this.findRoleByNameSync(name);
  }

  async findRoles(): Promise<RoleEntity[]> {
    return [...this.roles.values()];
  }

  async countRoles(): Promise<number> {
    return this.roles.size;
  }

  async createRole(data: {
    name: string;
    description?: string;
    isActive: boolean;
    permissionIds?: string[];
  }): Promise<RoleEntity | null> {
    return this.insertRole(data);
  }

  async insertRole(data: {
    name: string;
    description?: string;
    isActive: boolean;
    permissionIds?: string[];
  }): Promise<RoleEntity> {
    const entity = RoleEntity.create(data);
    this.save(entity);
    return entity;
  }

  async updateRole(): Promise<RoleEntity | null> {
    return null;
  }

  async deleteRole(): Promise<RoleEntity | null> {
    return null;
  }

  async countRolesWithPermissionId(): Promise<number> {
    return 0;
  }

  async findById(id: string): Promise<RoleEntity | null> {
    return this.findRoleById(id);
  }

  async findOne(): Promise<RoleEntity | null> {
    return null;
  }

  async find(): Promise<RoleEntity[]> {
    return this.findRoles();
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.findRoles();
  }

  async findAllByIds(ids: string[]): Promise<RoleEntity[]> {
    return ids.map((id) => this.roles.get(id)).filter((role): role is RoleEntity => Boolean(role));
  }

  async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<RoleEntity>> {
    const data = [...this.roles.values()];
    return new Paginated({ count: data.length, data, limit: params.limit, page: params.page });
  }

  async existsById(id: string): Promise<boolean> {
    return this.roles.has(id);
  }

  async count(): Promise<number> {
    return this.roles.size;
  }

  async insert(entity: RoleEntity): Promise<RoleEntity> {
    this.save(entity);
    return entity;
  }

  async insertMany(entities: RoleEntity[]): Promise<RoleEntity[]> {
    entities.forEach((entity) => this.save(entity));
    return entities;
  }

  async update(): Promise<RoleEntity | null> {
    return null;
  }

  async updateOne(): Promise<void> {}

  async updateMany(): Promise<number> {
    return 0;
  }

  async deleteById(id: string): Promise<boolean> {
    return this.roles.delete(id);
  }

  async deleteAllByIds(ids: string[]): Promise<boolean> {
    ids.forEach((id) => this.roles.delete(id));
    return true;
  }

  async transaction<T>(handler: () => Promise<T> | T): Promise<T> {
    return handler();
  }

  private save(entity: RoleEntity): void {
    this.roles.set(entity.id.toString(), entity);
  }

  private findRoleByNameSync(name: string): RoleEntity {
    const normalized = name.toUpperCase();
    const role = [...this.roles.values()].find((item) => item.toObject().name === normalized);
    if (!role) throw new Error(`Missing role ${name}`);
    return role;
  }
}

class MemoryRoleQueryRepository implements RoleQueryRepositoryPort {
  constructor(private readonly roles: MemoryRoleRepository) {}

  async findRoleWithPermissionsById(id: string): Promise<RoleWithPermissions | null> {
    const role = await this.roles.findRoleById(id);
    if (!role) return null;
    const roleObject = role.toObject() as RoleFullProps;
    return {
      ...roleObject,
      permissions: roleObject.name === EnumRoleName.ADMIN ? adminPermissions() : userPermissions()
    };
  }
}

class MemoryOtpRepository implements OtpRepositoryPort {
  private readonly otps = new Map<string, OtpEntity>();

  readCode(email: string, type: EnumOtpType): string {
    const otp = [...this.otps.values()]
      .map((entity) => entity.toObject())
      .find((item) => item.email === email.toLowerCase() && item.type === type);
    if (!otp) throw new Error(`Missing OTP for ${email}:${type}`);
    return otp.code;
  }

  async findUniqueOtpCode(data: { email: string; type: EnumOtpType }): Promise<OtpEntity | null> {
    return (
      [...this.otps.values()].find((entity) => {
        const otp = entity.toObject();
        return otp.email === data.email.toLowerCase() && otp.type === data.type;
      }) ?? null
    );
  }

  async createOtp(data: {
    email: string;
    code: string;
    type: EnumOtpType;
    expiresAt: Date;
  }): Promise<OtpEntity | null> {
    const entity = OtpEntity.create(data);
    this.otps.set(entity.id.toString(), entity);
    return entity;
  }

  async deleteOtp(id: string): Promise<OtpEntity | null> {
    const entity = this.otps.get(id) ?? null;
    this.otps.delete(id);
    return entity;
  }

  async deleteExpiredOtps(now: Date): Promise<number> {
    const expired = [...this.otps.values()].filter((entity) => entity.toObject().expiresAt < now);
    expired.forEach((entity) => this.otps.delete(entity.id.toString()));
    return expired.length;
  }

  async findById(id: string): Promise<OtpEntity | null> {
    return this.otps.get(id) ?? null;
  }

  async findOne(): Promise<OtpEntity | null> {
    return null;
  }

  async find(): Promise<OtpEntity[]> {
    return [...this.otps.values()];
  }

  async findAll(): Promise<OtpEntity[]> {
    return [...this.otps.values()];
  }

  async findAllByIds(ids: string[]): Promise<OtpEntity[]> {
    return ids.map((id) => this.otps.get(id)).filter((otp): otp is OtpEntity => Boolean(otp));
  }

  async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<OtpEntity>> {
    const data = [...this.otps.values()];
    return new Paginated({ count: data.length, data, limit: params.limit, page: params.page });
  }

  async existsById(id: string): Promise<boolean> {
    return this.otps.has(id);
  }

  async count(): Promise<number> {
    return this.otps.size;
  }

  async insert(entity: OtpEntity): Promise<OtpEntity> {
    this.otps.set(entity.id.toString(), entity);
    return entity;
  }

  async insertMany(entities: OtpEntity[]): Promise<OtpEntity[]> {
    entities.forEach((entity) => this.otps.set(entity.id.toString(), entity));
    return entities;
  }

  async update(): Promise<OtpEntity | null> {
    return null;
  }

  async updateOne(): Promise<void> {}

  async updateMany(): Promise<number> {
    return 0;
  }

  async deleteById(id: string): Promise<boolean> {
    return this.otps.delete(id);
  }

  async deleteAllByIds(ids: string[]): Promise<boolean> {
    ids.forEach((id) => this.otps.delete(id));
    return true;
  }

  async transaction<T>(handler: () => Promise<T> | T): Promise<T> {
    return handler();
  }
}

class MemoryRefreshTokenRepository implements RefreshTokenRepositoryPort {
  private readonly tokens = new Map<string, RefreshTokenEntity>();

  async findRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    return this.tokens.get(token) ?? null;
  }

  async createRefreshToken(data: { userId: string; token: string; expiresAt: Date }): Promise<RefreshTokenEntity> {
    const entity = RefreshTokenEntity.create(data);
    this.tokens.set(data.token, entity);
    return entity;
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    return this.tokens.delete(token);
  }

  async deleteExpiredRefreshTokens(now: Date): Promise<number> {
    const expired = [...this.tokens.values()].filter((entity) => entity.toObject().expiresAt < now);
    expired.forEach((entity) => this.tokens.delete(entity.toObject().token));
    return expired.length;
  }

  async rotateRefreshToken(data: {
    oldToken: string;
    newToken: string;
    userId: string;
    expiresAt: Date;
  }): Promise<boolean> {
    if (!this.tokens.has(data.oldToken)) return false;
    this.tokens.delete(data.oldToken);
    await this.createRefreshToken({ userId: data.userId, token: data.newToken, expiresAt: data.expiresAt });
    return true;
  }

  async findById(): Promise<RefreshTokenEntity | null> {
    return null;
  }

  async findOne(): Promise<RefreshTokenEntity | null> {
    return null;
  }

  async find(): Promise<RefreshTokenEntity[]> {
    return [...this.tokens.values()];
  }

  async findAll(): Promise<RefreshTokenEntity[]> {
    return [...this.tokens.values()];
  }

  async findAllByIds(): Promise<RefreshTokenEntity[]> {
    return [];
  }

  async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<RefreshTokenEntity>> {
    const data = [...this.tokens.values()];
    return new Paginated({ count: data.length, data, limit: params.limit, page: params.page });
  }

  async existsById(): Promise<boolean> {
    return false;
  }

  async count(): Promise<number> {
    return this.tokens.size;
  }

  async insert(entity: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    this.tokens.set(entity.toObject().token, entity);
    return entity;
  }

  async insertMany(entities: RefreshTokenEntity[]): Promise<RefreshTokenEntity[]> {
    entities.forEach((entity) => this.tokens.set(entity.toObject().token, entity));
    return entities;
  }

  async update(): Promise<RefreshTokenEntity | null> {
    return null;
  }

  async updateOne(): Promise<void> {}

  async updateMany(): Promise<number> {
    return 0;
  }

  async deleteById(): Promise<boolean> {
    return false;
  }

  async deleteAllByIds(): Promise<boolean> {
    return false;
  }

  async transaction<T>(handler: () => Promise<T> | T): Promise<T> {
    return handler();
  }
}

class MemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, UserEntity>();

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async findUserByUsername(username: string): Promise<UserEntity | null> {
    const normalized = Username.normalize(username);
    return [...this.users.values()].find((user) => user.toObject().username === normalized) ?? null;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const normalized = EmailAddress.normalize(email);
    return [...this.users.values()].find((user) => user.toObject().email === normalized) ?? null;
  }

  async findUserByEmailIncludeNameEmail(email: string): Promise<UserEntity | null> {
    return this.findUserByEmail(email);
  }

  async findManyUsersByIds(ids: string[]): Promise<UserEntity[]> {
    return ids.map((id) => this.users.get(id)).filter((user): user is UserEntity => Boolean(user));
  }

  async updateMe(id: string, data: UpdateMeInput): Promise<UserEntity | null> {
    return this.patchUser(id, data);
  }

  async resetPassword(id: string, data: ResetPasswordInput): Promise<boolean> {
    return Boolean(await this.patchUser(id, data));
  }

  async changePassword(id: string, data: ChangePasswordInput): Promise<UserEntity | null> {
    return this.patchUser(id, data);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.findUserById(id);
  }

  async findOne(): Promise<UserEntity | null> {
    return null;
  }

  async find(): Promise<UserEntity[]> {
    return [...this.users.values()];
  }

  async findAll(): Promise<UserEntity[]> {
    return [...this.users.values()];
  }

  async findAllByIds(ids: string[]): Promise<UserEntity[]> {
    return this.findManyUsersByIds(ids);
  }

  async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<UserEntity>> {
    const sorted = [...this.users.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const data = sorted.slice(params.offset, params.offset + params.limit);
    return new Paginated({ count: sorted.length, data, limit: params.limit, page: params.page });
  }

  async existsById(id: string): Promise<boolean> {
    return this.users.has(id);
  }

  async count(): Promise<number> {
    return this.users.size;
  }

  async insert(entity: UserEntity): Promise<UserEntity> {
    this.users.set(entity.id.toString(), entity);
    return entity;
  }

  async insertMany(entities: UserEntity[]): Promise<UserEntity[]> {
    entities.forEach((entity) => this.users.set(entity.id.toString(), entity));
    return entities;
  }

  async update(id: string, entity: Partial<UserEntity>): Promise<UserEntity | null> {
    return this.patchUser(id, entity as StoredUserPatch);
  }

  async updateOne(id: string, entity: Partial<UserEntity>): Promise<void> {
    await this.patchUser(id, entity as StoredUserPatch);
  }

  async updateMany(): Promise<number> {
    return 0;
  }

  async deleteById(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async deleteAllByIds(ids: string[]): Promise<boolean> {
    ids.forEach((id) => this.users.delete(id));
    return true;
  }

  async transaction<T>(handler: () => Promise<T> | T): Promise<T> {
    return handler();
  }

  private async patchUser(id: string, patch: StoredUserPatch): Promise<UserEntity | null> {
    const current = this.users.get(id);
    if (!current) return null;
    const currentObject = current.toObject() as UserFullProps;
    const merged: UserFullProps = {
      ...currentObject,
      ...stripUndefined(patch),
      totpSecret: patch.totpSecret === null ? undefined : (patch.totpSecret ?? currentObject.totpSecret),
      updatedAt: new Date()
    };
    const next = userEntityFromFullProps(merged);
    this.users.set(id, next);
    return next;
  }
}

class MemoryUserQueryRepository implements UserQueryRepositoryPort {
  constructor(
    private readonly users: MemoryUserRepository,
    private readonly roles: MemoryRoleRepository
  ) {}

  async findSafeUserById(id: string): Promise<UserSafeProps | null> {
    const user = await this.users.findUserById(id);
    return user ? toSafeUser(user.toObject() as UserFullProps) : null;
  }

  async findSafeUserByUsername(username: string): Promise<UserSafeProps | null> {
    const user = await this.users.findUserByUsername(username);
    return user ? toSafeUser(user.toObject() as UserFullProps) : null;
  }

  async findSafeUserByEmail(email: string): Promise<UserSafeProps | null> {
    const user = await this.users.findUserByEmail(email);
    return user ? toSafeUser(user.toObject() as UserFullProps) : null;
  }

  async findUserByIdIncludeRole(id: string): Promise<UserWithRole | null> {
    const user = await this.users.findUserById(id);
    return user ? this.withRole(user) : null;
  }

  async findUserByEmailIncludeRole(email: string): Promise<UserWithRole | null> {
    const user = await this.users.findUserByEmail(email);
    return user ? this.withRole(user) : null;
  }

  async findUsersForSearch(data: FindUsersForSearchInput): Promise<UserSafeProps[]> {
    const users = await this.users.findAll();
    const query = data.query.toLowerCase();
    return users
      .map((user) => toSafeUser(user.toObject() as UserFullProps))
      .filter((user) => user.name.toLowerCase().includes(query) || user.username?.includes(query))
      .slice(0, data.limit);
  }

  async findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]) {
    const users = await this.users.findManyUsersByIds(ids);
    return users.map((user) => {
      const item = user.toObject() as UserFullProps;
      return { id: item.id, name: item.name, username: item.username, avatar: item.avatar };
    });
  }

  private async withRole(user: UserEntity): Promise<UserWithRole> {
    const item = user.toObject() as UserFullProps;
    const role = await this.roles.findRoleById(item.roleId);
    const roleObject = role ? (role.toObject() as RoleFullProps) : null;
    return {
      ...item,
      role: roleObject
        ? {
            ...roleObject,
            deletedAt: roleObject.deletedAt ?? null,
            createdById: roleObject.createdById ?? null,
            updatedById: roleObject.updatedById ?? null,
            deletedById: roleObject.deletedById ?? null
          }
        : null
    };
  }
}

class CapturingOtpEmailQueue implements OtpEmailQueuePort {
  readonly jobs: OtpEmailJobData[] = [];

  async add(data: OtpEmailJobData): Promise<void> {
    this.jobs.push(data);
  }

  async close(): Promise<void> {}
}

const twoFactorService: TwoFactorAuthPort = {
  generateSecret: (email) => ({ secret: `secret:${email}`, uri: `otpauth://totp/${email}` }),
  verifyTOTP: ({ token }) => token === '123456'
};

const blockService: BlockServicePort = {
  isBlockedEitherWay: async () => false,
  getBlockedIdsByUserId: async () => []
};

export type AuthUserE2eApp = {
  app: Express;
  apiKey: string;
  userRoleId: string;
  adminRoleId: string;
  seedUser(data: {
    name: string;
    email: string;
    password: string;
    roleId: string;
    username?: string;
  }): Promise<UserFullProps>;
  readOtpCode(email: string, type: EnumOtpType): string;
};

export function createAuthUserE2eApp(): AuthUserE2eApp {
  const cacheManager = new MemoryCacheManager();
  const roleRepository = new MemoryRoleRepository();
  const roleQueryRepository = new MemoryRoleQueryRepository(roleRepository);
  const userRepository = new MemoryUserRepository();
  const userQueryRepository = new MemoryUserQueryRepository(userRepository, roleRepository);
  const otpRepository = new MemoryOtpRepository();
  const refreshTokenRepository = new MemoryRefreshTokenRepository();
  const hashingService = new HashingService();
  const tokenService = new TokenService(new JwtService(), {
    algorithm: 'HS256',
    accessTokenSecret: 'test-access-token-secret',
    refreshTokenSecret: 'test-refresh-token-secret',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d'
  });
  const roleService = new RoleService(roleRepository);
  const userService = new UserService(userRepository, userQueryRepository, cacheManager);
  const otpService = new OtpService(otpRepository, twoFactorService);
  const authService = new AuthService(refreshTokenRepository, tokenService);
  const otpEmailQueue = new CapturingOtpEmailQueue();

  const registerUC = new RegisterUseCase(userRepository, hashingService, otpRepository, otpService, roleService);
  const loginUC = new LoginEmailUseCase(userQueryRepository, otpService, hashingService, authService);
  const logoutUC = new LogoutUseCase(refreshTokenRepository);
  const refreshUC = new RefreshTokenUseCase(refreshTokenRepository, userQueryRepository, authService, tokenService);
  const forgotPasswordUC = new ForgotPasswordUseCase(
    userRepository,
    otpRepository,
    hashingService,
    userService,
    otpService,
    cacheManager
  );
  const sendOtpUC = new SendOtpUseCase(otpRepository, userRepository, otpEmailQueue);
  const setup2faUC = new Setup2FAUseCase(userRepository, userService, twoFactorService, cacheManager);
  const disable2faUC = new Disable2FAUseCase(userRepository, userService, otpService, cacheManager);
  const getMeUC = new GetMeUseCase(userService);
  const updateMeUC = new UpdateMeUseCase(userRepository, userService, cacheManager);
  const getProfileUC = new GetUserProfileUseCase(userService, blockService);
  const changePasswordUC = new ChangePasswordUseCase(userRepository, hashingService, cacheManager);
  const adminListUC = new AdminListUsersUseCase(userRepository);
  const adminGetUC = new AdminGetUserUseCase(userRepository);
  const adminCreateUC = new AdminCreateUserUseCase(
    userRepository,
    userService,
    roleRepository,
    roleService,
    hashingService
  );
  const adminUpdateUC = new AdminUpdateUserUseCase(
    userRepository,
    userService,
    roleRepository,
    roleService,
    hashingService,
    cacheManager
  );
  const adminDeleteUC = new AdminDeleteUserUseCase(userRepository, roleService, cacheManager);

  const authController = new AuthController(
    registerUC,
    loginUC,
    logoutUC,
    refreshUC,
    forgotPasswordUC,
    sendOtpUC,
    setup2faUC,
    disable2faUC
  );
  const userController = new UserController(getMeUC, updateMeUC, getProfileUC, changePasswordUC);
  const adminUserController = new AdminUserController(
    adminListUC,
    adminGetUC,
    adminCreateUC,
    adminUpdateUC,
    adminDeleteUC
  );

  const authGuard = new AuthGuard(roleQueryRepository, tokenService, cacheManager);
  const authOptionGuard = new AuthOptionGuard(tokenService);
  const activeUserGuard = new ActiveUserGuard(userService);
  const apiKeyGuard = new ApiKeyGuard(apiKey);
  const throttlerGuard = new ThrottlerProxyGuard(testAppConfig(), {} as RedisClientPort); // rate limit is disabled in e2e, so redis is never touched;
  const loggingInterceptor = new LoggingInterceptor(logger);
  const transformResponseInterceptor = new TransformResponseInterceptor();
  const timeoutInterceptor = new TimeoutInterceptor();
  const idempotencyInterceptor = new IdempotencyInterceptor(cacheManager);

  const routers = [
    new AuthRoute(
      authController,
      new AuthPipe(),
      authGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor
    ),
    new UserRoute(
      userController,
      new UsersPipe(),
      authGuard,
      authOptionGuard,
      activeUserGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    ),
    new AdminUserRoute(
      adminUserController,
      new AdminUsersPipe(),
      new PaginationPipe(),
      authGuard,
      apiKeyGuard,
      throttlerGuard,
      loggingInterceptor,
      transformResponseInterceptor,
      timeoutInterceptor,
      idempotencyInterceptor
    )
  ];

  const app = createExpressApp({ getRouters: () => routers, getLogger: () => logger } as unknown as IContainer);

  return {
    app,
    apiKey,
    userRoleId: roleRepository.userRoleId,
    adminRoleId: roleRepository.adminRoleId,
    seedUser: async (data) => {
      const user = UserEntity.create({
        name: data.name,
        email: data.email,
        password: bcrypt.hashSync(data.password, 10),
        birthday: new Date('1990-01-01'),
        roleId: data.roleId,
        username: data.username,
        status: EnumUserStatus.ACTIVE
      });
      await userRepository.insert(user);
      return user.toObject() as UserFullProps;
    },
    readOtpCode: (email, type) => otpRepository.readCode(email, type)
  };
}

function userEntityFromFullProps(props: UserFullProps): UserEntity {
  return new UserEntity({
    id: new UniqueEntityID(props.id),
    createdAt: props.createdAt,
    createdById: props.createdById,
    updatedAt: props.updatedAt,
    updatedById: props.updatedById,
    deletedAt: props.deletedAt,
    deletedById: props.deletedById,
    props: {
      name: props.name,
      email: EmailAddress.create(props.email),
      password: props.password,
      birthday: props.birthday,
      roleId: props.roleId,
      status: props.status,
      totpSecret: props.totpSecret,
      bio: props.bio,
      location: props.location,
      website: props.website,
      username: Username.createOptional(props.username),
      avatar: props.avatar,
      coverPhoto: props.coverPhoto
    }
  });
}

function toSafeUser(user: UserFullProps): UserSafeProps {
  const { password, totpSecret, ...safe } = user;
  void password;
  void totpSecret;
  return safe;
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

function userPermissions(): PermissionFullProps[] {
  return [
    permission(EnumHttpMethod.POST, '/api/v1/auth/logout'),
    permission(EnumHttpMethod.POST, '/api/v1/auth/2fa/enable'),
    permission(EnumHttpMethod.POST, '/api/v1/auth/2fa/disable'),
    permission(EnumHttpMethod.GET, '/api/v1/users/me'),
    permission(EnumHttpMethod.PATCH, '/api/v1/users/me'),
    permission(EnumHttpMethod.PUT, '/api/v1/users/change-password')
  ];
}

function adminPermissions(): PermissionFullProps[] {
  return [
    ...userPermissions(),
    permission(EnumHttpMethod.GET, '/api/v1/admin/users'),
    permission(EnumHttpMethod.POST, '/api/v1/admin/users'),
    permission(EnumHttpMethod.GET, '/api/v1/admin/users/:userId'),
    permission(EnumHttpMethod.PUT, '/api/v1/admin/users/:userId'),
    permission(EnumHttpMethod.DELETE, '/api/v1/admin/users/:userId')
  ];
}

function permission(method: EnumHttpMethod, path: string): PermissionFullProps {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    id: `permission_${method}_${path}`,
    name: `${method} ${path}`,
    description: '',
    method,
    path,
    module: 'e2e',
    createdAt: now,
    updatedAt: now,
    createdById: null,
    updatedById: null,
    deletedAt: null,
    deletedById: null
  };
}

function testAppConfig(): IAppConfig {
  return {
    port: 0,
    client: { url: 'http://localhost:3000' },
    jwt: {
      algorithm: 'HS256',
      accessTokenSecret: 'test-access-token-secret',
      refreshTokenSecret: 'test-refresh-token-secret',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d'
    },
    auth: { apiKey },
    logs: { level: 'silent' },
    api: { prefix: '/api' },
    cors: { origin: ['http://localhost:3000'], credentials: true },
    rateLimit: { enabled: false },
    email: { apiKey: 'test-email-api-key', fromAddress: 'no-reply@example.com' },
    systemHealth: {
      enabled: false,
      cron: '*/1 * * * *',
      timezone: 'Asia/Ho_Chi_Minh',
      diskPath: '/',
      adminEmails: [],
      alertCooldownSeconds: 1800,
      thresholds: {
        cpu: { warning: 80, critical: 90 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 80, critical: 90 },
        processMemoryMb: { warning: 512, critical: 1024 }
      }
    },
    google: {
      clientId: 'test-google-client-id',
      clientSecret: 'test-google-client-secret',
      redirectUri: 'http://localhost:3000/oauth/google'
    },
    s3: {
      region: 'us-east-1',
      accessKeyId: 'test-aws-access-key-id',
      secretAccessKey: 'test-aws-secret-access-key',
      bucketName: 'test-bucket'
    },
    cloudinary: {
      cloudName: 'test-cloud-name',
      apiKey: 'test-cloudinary-api-key',
      apiSecret: 'test-cloudinary-api-secret'
    },
    payment: {
      vnpay: {
        tmnCode: 'VNPAY_TEST_MERCHANT',
        secureSecret: 'vnpay-test-secret',
        vnpayHost: 'https://sandbox.vnpayment.vn'
      },
      momo: {
        partnerCode: 'MOMO_TEST_PARTNER',
        accessKey: 'momo-test-access-key',
        secretKey: 'momo-test-secret-key',
        storeId: 'MomoTestStore',
        storeName: 'Social Test Store'
      },
      paymentPublicBaseUrl: 'https://social-tunnel.test'
    }
  };
}

export { EnumOtpType, EnumUserStatus };
