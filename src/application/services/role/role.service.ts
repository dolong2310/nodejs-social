import { RoleNotFoundException } from '@/application/exceptions/role.exception';
import { ERoleName } from '@/domain/entities/role/role.type';
import { RoleRepositoryPort } from '@/domain/repositories/role/role.repository';

export interface IRoleService {
  getAdminRoleId(): Promise<string>;
  getUserRoleId(): Promise<string>;
}

export class RoleService {
  private userRoleId: string | null = null;
  private adminRoleId: string | null = null;

  constructor(private readonly roleRepository: RoleRepositoryPort) {}

  async getAdminRoleId(): Promise<string> {
    if (this.adminRoleId) return this.adminRoleId;
    const id = await this._getRoleId(ERoleName.ADMIN);
    this.adminRoleId = id;
    return id;
  }

  async getUserRoleId(): Promise<string> {
    if (this.userRoleId) return this.userRoleId;
    const id = await this._getRoleId(ERoleName.USER);
    this.userRoleId = id;
    return id;
  }

  private async _getRoleId(roleName: ERoleName): Promise<string> {
    const roleEntity = await this.roleRepository.findRoleByName(roleName);
    if (!roleEntity) {
      throw RoleNotFoundException;
    }
    return roleEntity.id.toString();
  }
}
