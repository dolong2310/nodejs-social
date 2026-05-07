export enum EnumDatabaseDriver {
  MONGO = 'mongodb',
  POSTGRES = 'postgres'
}

export interface DatabasePort {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
