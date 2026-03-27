export class MarkNotificationsReadBodyDTO {
  ids?: string[];
  constructor(body: { ids?: string[] }) {
    this.ids = body.ids;
  }
}
