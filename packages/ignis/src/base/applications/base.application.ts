import { BindingKeys, BindingNamespaces } from '@/common/bindings';
import { RuntimeModules } from '@/common/constants';
import type { IClass, IDataSource, IRepository, IService, ValueOrPromise } from '@/common/types';
import { IRouteMetadata, MetadataRegistry } from '@/helpers/inversion';
import { getError } from '@/utilities/error.utility';
import type { Context } from 'hono';
import { AbstractApplication } from './abstract.application';

const {
  NODE_ENV,
  RUN_MODE,
  ALLOW_EMPTY_ENV_VALUE = false,
  APPLICATION_ENV_PREFIX = 'APP_ENV',

  APP_ENV_APPLICATION_NAME = 'PNT',
  APP_ENV_APPLICATION_TIMEZONE = 'Asia/Ho_Chi_Minh',
  APP_ENV_DS_MIGRATION = 'postgres',
  APP_ENV_DS_AUTHORIZE = 'postgres',
  APP_ENV_LOGGER_FOLDER_PATH = './',
} = process.env;

// ------------------------------------------------------------------------------
export abstract class BaseApplication extends AbstractApplication {
  // ------------------------------------------------------------------------------
  abstract override staticConfigure(): void;
  abstract override preConfigure(): ValueOrPromise<void>;
  abstract override postConfigure(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  controller<T>(controllerClass: IClass<T>): any {
    this.bind<T>(
      BindingKeys.build({
        namespace: BindingNamespaces.CONTROLLER,
        key: controllerClass.name,
      }),
    ).toClass(controllerClass);
    this.registerController({ controllerClass });
    return this;
  }

  repository<T extends IRepository>(ctor: IClass<T>): void {
    this.bind(
      BindingKeys.build({
        namespace: BindingNamespaces.REPOSITORY,
        key: ctor.name,
      }),
    ).toClass(ctor);
  }

  service<T extends IService>(ctor: IClass<T>): void {
    this.bind(
      BindingKeys.build({
        namespace: BindingNamespaces.SERVICE,
        key: ctor.name,
      }),
    ).toClass(ctor);
  }

  dataSource<T extends IDataSource>(ctor: IClass<T>): void {
    this.bind(
      BindingKeys.build({
        namespace: BindingNamespaces.DATASOURCE,
        key: ctor.name,
      }),
    ).toClass(ctor);
  }

  // ------------------------------------------------------------------------------
  static(opts: { restPath?: string; folderPath: string }) {
    const { restPath = '*', folderPath } = opts;
    const server = this.getServer();

    switch (this.server.runtime) {
      case RuntimeModules.BUN: {
        const { serveStatic } = require('hono/bun');
        server.use(restPath, serveStatic({ root: folderPath }));
        break;
      }
      case RuntimeModules.NODE: {
        try {
          const { serveStatic } = require('@hono/node-server/serve-static');
          server.use(restPath, serveStatic({ root: folderPath }));
        } catch (error) {
          this.logger.error('[static] Failed to serve static file | Error: %s', error);
          throw getError({
            message: `[static] @hono/node-server is required for Node.js runtime. Please install '@hono/node-server'`,
          });
        }
        break;
      }
      default: {
        throw getError({
          message: '[static] Invalid server runtime to config static loader!',
        });
      }
    }

    this.logger.debug(
      '[static] Registered static files | runtime: %s | path: %s | folder: %s',
      this.server.runtime,
      restPath,
      folderPath,
    );
  }

  // ------------------------------------------------------------------------------
  protected normalizePath(...segments: string[]): string {
    const joined = segments.join('/').replace(/\/+/g, '/').replace(/\/$/, '');
    return joined || '/';
  }

  protected registerController<T>(opts: { controllerClass: IClass<T> }): void {
    const { controllerClass } = opts;
    const routes = MetadataRegistry.getRouteMetadata(controllerClass);
    const totalRoute = routes?.length ?? 0;

    if (!totalRoute) {
      this.logger.debug(
        '[registerController] Skip register controller | totalRoute: %s',
        totalRoute,
      );
      return;
    }

    const controllerInstance = this.resolve(controllerClass);
    for (let index = 0; index < totalRoute; index++) {
      const route = routes[index];
      this.registerRoute({ controllerInstance, route });
    }

    this.logger.debug('[registerController] Registered controllers | totalRoute: %s', totalRoute);
  }

  protected registerRoute(opts: { controllerInstance: any; route: IRouteMetadata }): void {
    const { controllerInstance, route } = opts;
    const fullPath = this.normalizePath(route.path);
    const method = route.method.toLowerCase();
    const methodName = route.methodName;

    // Create route handler
    const handler = async (c: Context) => {
      const rs = await controllerInstance[methodName](this, c);
      return rs;
    };

    const server = this.getServer();
    server.on(method, fullPath, handler);

    this.logger.info(
      '[registerRoute] Route | method: %s | path: %s | methodName: %s',
      route.method,
      fullPath,
      String(methodName),
    );
  }

  override async initialize() {
    this.logger.info(
      '[initialize] ------------------------------------------------------------------------',
    );
    this.logger.info(
      '[initialize] Starting application... | Name: %s | Env: %s | Runtime: %s',
      APP_ENV_APPLICATION_NAME,
      NODE_ENV,
      this.server.runtime,
    );
    this.logger.info(
      '[initialize] AllowEmptyEnv: %s | Prefix: %s',
      ALLOW_EMPTY_ENV_VALUE,
      APPLICATION_ENV_PREFIX,
    );
    this.logger.info('[initialize] RunMode: %s', RUN_MODE);
    this.logger.info('[initialize] Timezone: %s', APP_ENV_APPLICATION_TIMEZONE);
    this.logger.info('[initialize] LogPath: %s', APP_ENV_LOGGER_FOLDER_PATH);
    this.logger.info(
      '[initialize] Datasource | Migration: %s | Authorize: %s',
      APP_ENV_DS_MIGRATION,
      APP_ENV_DS_AUTHORIZE,
    );
    this.logger.info(
      '[initialize] ------------------------------------------------------------------------',
    );

    // this.bind(AuthenticateKeys.ALWAYS_ALLOW_PATHS).to([]);

    this.staticConfigure();
    this.projectRoot = this.getProjectRoot();
    this.logger.info('[initialize] Project root: %s', this.projectRoot);

    this.validateEnvs();

    this.logger.info('[initialize] Declare application models...');

    this.logger.info('[initialize] Executing Pre-Configuration...');
    await this.preConfigure();

    this.logger.info('[initialize] Executing Post-Configuration...');
    await this.postConfigure();
  }
}
