import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateOtpProps, OtpProps } from '@/domain/entities/otp/otp.type';

export class OtpEntity extends Entity<OtpProps> {
  static create(createProps: CreateOtpProps) {
    const id = new UniqueEntityID();
    const props: OtpProps = {
      ...createProps
    };
    const otp = new OtpEntity({ id, props });
    return otp;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
