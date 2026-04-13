import {
  ListForViewerPayloadDTO,
  MarkReadPayloadDTO,
  MarkSingleReadPayloadDTO,
  RecordAddedToGroupPayloadDTO,
  RecordFriendAcceptedPayloadDTO,
  RecordFriendRequestPayloadDTO,
  RecordNewMessagePayloadDTO
} from '@/application/dtos/notification/notification.payload.dto';
import { ListForViewerResultDTO } from '@/application/dtos/notification/notification.result.dto';

export interface ISocketUserEmitter {
  emitToUser(userId: string, event: string, data: unknown): void;
}

export interface INotificationsService {
  bindSocketEmitter(emitter: ISocketUserEmitter | null): void;
  listForViewer(payload: ListForViewerPayloadDTO): Promise<ListForViewerResultDTO>;
  markRead(payload: MarkReadPayloadDTO): Promise<void>;
  markSingleRead(payload: MarkSingleReadPayloadDTO): Promise<void>;
  recordFriendRequest(payload: RecordFriendRequestPayloadDTO): Promise<void>;
  recordFriendAccepted(payload: RecordFriendAcceptedPayloadDTO): Promise<void>;
  recordNewMessage(payload: RecordNewMessagePayloadDTO): Promise<void>;
  recordAddedToGroup(payload: RecordAddedToGroupPayloadDTO): Promise<void>;
}
