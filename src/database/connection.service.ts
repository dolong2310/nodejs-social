export abstract class ConnectionService {
  protected disconnected = false;

  abstract connect(): Promise<void>;

  async disconnect(): Promise<void> {
    if (this.disconnected) return;
    this.disconnected = true;
    await this.releaseConnection();
  }

  protected abstract releaseConnection(): Promise<void>;
}
