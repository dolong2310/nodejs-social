import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateNotificationProps, NotificationProps } from '@/domain/entities/notification/notification.type';

export class NotificationEntity extends Entity<NotificationProps> {
  static create(createProps: CreateNotificationProps) {
    const id = new UniqueEntityID();
    const props: NotificationProps = { ...createProps };
    const notification = new NotificationEntity({ id, props });
    return notification;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
