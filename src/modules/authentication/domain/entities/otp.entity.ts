import { CreateOtpProps, EnumOtpType, OtpFullProps, OtpProps } from '@/modules/authentication/domain/entities/otp.type';
import { OtpCode } from '@/modules/authentication/domain/value-objects/otp-code.value-object';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';

export class OtpEntity extends Entity<OtpProps, OtpFullProps> {
  static create(createProps: CreateOtpProps) {
    const id = new UniqueEntityID(generatePrefixId('otp'));
    const props: OtpProps = {
      ...createProps,
      email: EmailAddress.create(createProps.email),
      code: OtpCode.create(createProps.code)
    };
    const otp = new OtpEntity({ id, props });
    return otp;
  }

  validate(): void {
    const { email, code, type, expiresAt } = this.getProps();
    invariant(email instanceof EmailAddress, new ArgumentInvalidException('OTP email must be an EmailAddress'));
    invariant(code instanceof OtpCode, new ArgumentInvalidException('OTP code must be an OtpCode'));
    invariant(Object.values(EnumOtpType).includes(type), new ArgumentInvalidException('Invalid OTP type'));
    invariant(expiresAt instanceof Date, new ArgumentInvalidException('Expiry date must be a valid Date'));
  }
}
