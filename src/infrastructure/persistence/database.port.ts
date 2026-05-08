export enum EnumDatabaseDriver {
  MONGO = 'mongo',
  POSTGRES = 'postgres'
}

export interface DatabasePort {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
