import { RoleNameAlreadyExistsException } from '@/modules/role/application/role.exception';
import { CreateRoleCommand, CreateRolePort } from '@/modules/role/application/use-cases/create-role/create-role.port';
import { RoleListItem } from '@/modules/role/application/use-cases/list-roles/list-roles.port';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';

export class CreateRoleUseCase extends CreateRolePort {
  constructor(private readonly roleRepository: RoleRepositoryPort) {
    super();
  }

  async execute(command: CreateRoleCommand) {
    const duplicate = await this.roleRepository.findRoleByName(command.name);
    if (duplicate) {
      throw new RoleNameAlreadyExistsException();
    }
    const entity = await this.roleRepository.insertRole({
      name: command.name,
      description: command.description ?? '',
      isActive: command.isActive ?? true,
      permissionIds: command.permissionIds ?? []
    });
    return new RoleListItem(entity.toObject());
  }
}
