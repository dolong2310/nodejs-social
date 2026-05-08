import {
  CreateRefreshTokenProps,
  RefreshTokenProps
} from '@/modules/authentication/domain/entities/refresh-token.type';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';

export class RefreshTokenEntity extends Entity<RefreshTokenProps> {
  static create(createProps: CreateRefreshTokenProps) {
    const id = new UniqueEntityID(generatePrefixId('refresh_token'));
    const props: RefreshTokenProps = { ...createProps };
    const refreshToken = new RefreshTokenEntity({ id, props });
    return refreshToken;
  }

  validate(): void {
    const { userId, token, expiresAt } = this.getProps();
    invariant(userId.trim().length > 0, new ArgumentNotProvidedException('User ID is required'));
    invariant(token.trim().length > 0, new ArgumentNotProvidedException('Token is required'));
    invariant(expiresAt instanceof Date, new ArgumentInvalidException('Expiry date must be a valid Date'));
  }
}
