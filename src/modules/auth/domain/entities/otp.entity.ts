import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreateOtpProps, EOtpType, OtpProps } from '@/modules/auth/domain/entities/otp.type';

export class OtpEntity extends Entity<OtpProps> {
  static create(createProps: CreateOtpProps) {
    const id = new UniqueEntityID(generatePrefixId('otp'));
    const props: OtpProps = {
      ...createProps
    };
    const otp = new OtpEntity({ id, props });
    return otp;
  }

  validate(): void {
    const { email, code, type, expiresAt } = this.getProps();
    invariant(email.trim().length > 0, new ArgumentNotProvidedException('Email is required'));
    invariant(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), new ArgumentInvalidException('Invalid email format'));
    invariant(code.trim().length > 0, new ArgumentNotProvidedException('OTP code is required'));
    invariant(Object.values(EOtpType).includes(type), new ArgumentInvalidException('Invalid OTP type'));
    invariant(expiresAt instanceof Date, new ArgumentInvalidException('Expiry date must be a valid Date'));
  }
}
