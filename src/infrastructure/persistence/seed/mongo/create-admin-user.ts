/**
 * Create or repair the initial admin user in MongoDB.
 *
 * Run:
 * `pnpm run seed:create-admin-user -- --env=development`
 *
 * Prerequisite:
 * Run `pnpm run seed:permissions -- --env=development` first so the ADMIN role exists.
 *
 * Optional environment overrides:
 * - SEED_ADMIN_EMAIL
 * - SEED_ADMIN_PASSWORD
 * - SEED_ADMIN_NAME
 * - SEED_ADMIN_USERNAME
 * - SEED_ADMIN_BIRTHDAY (ISO date string)
 */
import logger from '@/infrastructure/logger/create-logger';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { MongoDatabase } from '@/infrastructure/persistence/mongodb/database';
import { HashingService } from '@/modules/authentication/infrastructure/services/hashing.service';
import { EnumRoleName } from '@/modules/authorization/domain/entities/role.type';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/mongo/role.impl.repository';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { UserRepository } from '@/modules/user/infrastructure/persistence/mongo/user.impl.repository';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mongo/user.mapper';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'ddl.231098@gmail.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? '@Bc123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Administrator';
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? 'admin';
const ADMIN_BIRTHDAY = new Date(process.env.SEED_ADMIN_BIRTHDAY ?? '2000-01-01T00:00:00.000Z');

if (Number.isNaN(ADMIN_BIRTHDAY.getTime())) {
  throw new Error('SEED_ADMIN_BIRTHDAY must be a valid ISO date string.');
}

const mongo = new MongoDatabase({
  uri: dbConfig.mongodb.uri,
  databaseName: dbConfig.mongodb.name
});

const { db, dbClient } = mongo;
const hashingService = new HashingService();
const userRepository = new UserRepository(db, dbClient, new UserMapper(), logger);
const roleRepository = new RoleRepository(db, dbClient, new RoleMapper(), logger);

async function ensureAdminUsernameAvailable(): Promise<void> {
  const userWithUsername = await userRepository.findUserByUsername(ADMIN_USERNAME);
  if (userWithUsername && userWithUsername.getProps().email.value !== ADMIN_EMAIL) {
    throw new Error(`Username "${ADMIN_USERNAME}" is already used by another user.`);
  }
}

async function createOrUpdateAdminUser(adminRoleId: string): Promise<void> {
  const hashedPassword = await hashingService.hash(ADMIN_PASSWORD);
  const existingAdmin = await userRepository.findUserByEmail(ADMIN_EMAIL);

  if (!existingAdmin) {
    await ensureAdminUsernameAvailable();
    const admin = UserEntity.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      birthday: ADMIN_BIRTHDAY,
      roleId: adminRoleId,
      status: EnumUserStatus.ACTIVE,
      username: ADMIN_USERNAME
    });
    const created = await userRepository.insert(admin);
    console.log(`Created admin user ${created.id.toString()} (${ADMIN_EMAIL}).`);
    return;
  }

  await ensureAdminUsernameAvailable();
  await userRepository.updateOne(existingAdmin.id.toString(), {
    name: ADMIN_NAME,
    birthday: ADMIN_BIRTHDAY,
    roleId: adminRoleId,
    status: EnumUserStatus.ACTIVE,
    username: ADMIN_USERNAME
  } as Partial<UserEntity>);
  await userRepository.resetPassword(existingAdmin.id.toString(), { password: hashedPassword });
  console.log(`Updated admin user ${existingAdmin.id.toString()} (${ADMIN_EMAIL}) with ADMIN role.`);
}

async function main(): Promise<void> {
  await mongo.connect();
  await Promise.all([mongo.initializeIndexes(), mongo.initializeConversationIndexes()]);

  const adminRole = await roleRepository.findRoleByName(EnumRoleName.ADMIN);
  if (!adminRole) {
    throw new Error(
      `Role "${EnumRoleName.ADMIN}" not found. Run 'pnpm run seed:permissions -- --env=development' first.`
    );
  }

  await createOrUpdateAdminUser(adminRole.id.toString());
  await mongo.disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  console.error(error);
  await mongo.disconnect().catch(() => {});
  process.exit(1);
});

export default main;
