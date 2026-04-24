import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { RefreshTokenProps, CreateRefreshTokenProps } from '@/domain/entities/refresh-token/refresh-token.type';

export class RefreshTokenEntity extends Entity<RefreshTokenProps> {
  static create(createProps: CreateRefreshTokenProps) {
    const id = new UniqueEntityID();
    const props: RefreshTokenProps = { ...createProps };
    const refreshToken = new RefreshTokenEntity({ id, props });
    return refreshToken;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
