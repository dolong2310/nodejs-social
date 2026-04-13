export interface IMimeService {
  getType(filepath: string, defaultType?: string): string;
  getContentType(filepath: string, defaultType?: string): string;
}
