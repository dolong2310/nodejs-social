export interface IPathService {
  resolve(...paths: string[]): string;
  join(...paths: string[]): string;
}
