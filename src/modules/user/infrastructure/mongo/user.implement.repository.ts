// import { consola } from 'consola';
// import type { Emitter } from 'mitt';
// import type { EmitDomainEvents } from '@/modules/core/domain-base/events/domain-event.types';
// import { MySQLRepositoryBase } from '@/modules/core/infra-base/persistence/repo/repository.mysql.base';
// import type { UserEntity } from '@/modules/user/domain/entities/user.entity';
// import type { UserModel } from '@/modules/user/domain/repositories/user.model';
// import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
// import type { UserMapper } from '@/modules/user/infrastructure/mappers/user.mapper';
// import { getDBClient } from './plannet-scale.config';

// export class UserMongoRepository
//   extends MySQLRepositoryBase<UserEntity, UserModel, { users: UserModel }>
//   implements IUserRepository
// {
//   protected tableName = 'users';
//   protected db = getDBClient();

//   constructor(mapper: UserMapper, emitter: Emitter<EmitDomainEvents>) {
//     super(mapper, emitter, consola);
//   }
// }
