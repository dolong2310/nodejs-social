import { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.types';

export type AvailableRoute = {
  name: string;
  path: string;
  method: EnumHttpMethod;
  module: string;
};

export abstract class RoutePermissionCatalogPort {
  abstract getAvailableRoutes(): AvailableRoute[];
}
