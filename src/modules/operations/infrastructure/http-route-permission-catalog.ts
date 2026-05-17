import { appConfig } from '@/bootstrap/config/app.config';
import {
  buildStubHttpRouters,
  permissionModuleTagFromBaseRoutePath
} from '@/infrastructure/persistence/seed/stub-http-routers.seed';
import { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import {
  AvailableRoute,
  RoutePermissionCatalogPort
} from '@/modules/operations/application/ports/route-permission-catalog.port';
import type { BaseRoute } from '@/presentation/http/express/core/base.route';
import type { Router } from 'express';

const VALID_HTTP_METHODS = new Set<string>(Object.values(EnumHttpMethod));

type ExpressRouteLayer = { route?: { path: string | string[] | RegExp; methods?: Record<string, boolean> } };

export class HttpRoutePermissionCatalog extends RoutePermissionCatalogPort {
  getAvailableRoutes(): AvailableRoute[] {
    return this.discoverApiRoutesFromBaseRouteList(buildStubHttpRouters());
  }

  private discoverApiRoutesFromBaseRouteList(baseRouteList: BaseRoute[]): AvailableRoute[] {
    const allDiscoveredRoutes: AvailableRoute[] = [];
    for (const baseRoute of baseRouteList) {
      const fullMountPath = this.joinExpressPathSegments(
        appConfig.api.prefix,
        baseRoute.getVersion(),
        baseRoute.getPath()
      );
      const permissionModuleTag = permissionModuleTagFromBaseRoutePath(baseRoute.getPath());
      this.collectRoutesFromExpressRouter(
        baseRoute.getRouter() as unknown as Router,
        fullMountPath,
        permissionModuleTag,
        allDiscoveredRoutes
      );
    }

    const alreadySeenMethodPathKeys = new Set<string>();
    return allDiscoveredRoutes.filter((route) => {
      const methodPathKey = `${route.method}-${route.path}`;
      if (alreadySeenMethodPathKeys.has(methodPathKey)) return false;
      alreadySeenMethodPathKeys.add(methodPathKey);
      return true;
    });
  }

  private collectRoutesFromExpressRouter(
    expressRouter: Router,
    pathPrefix: string,
    permissionModuleTag: string,
    collectedRoutes: AvailableRoute[]
  ): void {
    for (const layer of expressRouter.stack as ExpressRouteLayer[]) {
      const expressRoute = layer.route;
      if (!expressRoute) continue;

      const routePathPattern =
        typeof expressRoute.path === 'string'
          ? expressRoute.path
          : Array.isArray(expressRoute.path)
            ? expressRoute.path[0]!
            : String(expressRoute.path);

      const fullHttpPath = this.joinExpressPathSegments(pathPrefix, routePathPattern);
      const methodFlags = expressRoute.methods;
      if (!methodFlags) continue;

      for (const methodName of Object.keys(methodFlags)) {
        if (methodName === '_all' || !methodFlags[methodName]) continue;
        const httpMethod = methodName.toUpperCase();
        if (!VALID_HTTP_METHODS.has(httpMethod)) continue;
        collectedRoutes.push({
          name: `${httpMethod}+${fullHttpPath}`,
          path: fullHttpPath,
          method: httpMethod as EnumHttpMethod,
          module: permissionModuleTag
        });
      }
    }
  }

  private joinExpressPathSegments(...segments: string[]): string {
    const parts = segments
      .map((segment) => segment.replace(/^\/+/, '').replace(/\/+$/, ''))
      .filter((segment) => segment.length > 0);
    return '/' + parts.join('/');
  }
}
