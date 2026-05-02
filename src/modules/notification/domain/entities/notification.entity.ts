import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import {
  CreateNotificationProps,
  ENotificationType,
  NotificationProps
} from '@/modules/notification/domain/entities/notification.type';

export class NotificationEntity extends Entity<NotificationProps> {
  static create(createProps: CreateNotificationProps) {
    const id = new UniqueEntityID(generatePrefixId('notification'));
    const props: NotificationProps = { ...createProps };
    const notification = new NotificationEntity({ id, props });
    return notification;
  }

  validate(): void {
    const { recipientId, type, actor, payload } = this.getProps();
    invariant(recipientId.trim().length > 0, new ArgumentNotProvidedException('Recipient ID is required'));
    invariant(
      Object.values(ENotificationType).includes(type),
      new ArgumentInvalidException('Invalid notification type')
    );
    invariant(actor != null, new ArgumentNotProvidedException('Notification actor is required'));
    invariant(actor.userId.trim().length > 0, new ArgumentNotProvidedException('Actor user ID is required'));
    invariant(actor.displayName.trim().length > 0, new ArgumentNotProvidedException('Actor display name is required'));
    invariant(payload != null, new ArgumentNotProvidedException('Notification payload is required'));
  }
}
