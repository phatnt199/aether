import { BindingKeys, BindingNamespaces, CoreBindings } from '@/common/bindings';
import { RuntimeModules } from '@/common/constants';
import { AnyObject, IClass } from '@/common/types';
import { BindingScopes } from '@/helpers/inversion';
import { getError } from '@/helpers/error';
import { BaseComponent } from '../components';
import { IDataSource } from '../datasources';
import { IRepository } from '../repositories';
import { IService } from '../services';
import { AbstractApplication } from './abstract.application';
import { IApplication, IRestApplication } from './types';

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
export abstract class BaseApplication extends AbstractApplication implements IRestApplication {
  component<T extends BaseComponent, O extends AnyObject = any>(
    ctor: IClass<T>,
    _args?: O,
  ): IApplication {
    this.bind({
      key: BindingKeys.build({
        namespace: BindingNamespaces.COMPONENT,
        key: ctor.name,
      }),
    })
      .toClass(ctor)
      .setScope(BindingScopes.SINGLETON);
    return this;
  }

  controller<T>(ctor: IClass<T>): IApplication {
    this.bind<T>({
      key: BindingKeys.build({
        namespace: BindingNamespaces.CONTROLLER,
        key: ctor.name,
      }),
    }).toClass(ctor);
    // this.registerController({ controllerClass });
    return this;
  }

  repository<T extends IRepository>(ctor: IClass<T>): IApplication {
    this.bind({
      key: BindingKeys.build({
        namespace: BindingNamespaces.REPOSITORY,
        key: ctor.nameff,
      }),
    }).toClass(ctor);
    return this;
  }

  service<T extends IService>(ctor: IClass<T>): IApplication {
    this.bind({
      key: BindingKeys.build({
        namespace: BindingNamespaces.SERVICE,
        key: ctor.name,
      }),
    }).toClass(ctor);
    return this;
  }

  dataSource<T extends IDataSource>(ctor: IClass<T>): IApplication {
    this.bind({
      key: BindingKeys.build({
        namespace: BindingNamespaces.DATASOURCE,
        key: ctor.name,
      }),
    }).toClass(ctor);
    return this;
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
    return this;
  }

  // ------------------------------------------------------------------------------
  protected normalizePath(...segments: string[]): string {
    const joined = segments.join('/').replace(/\/+/g, '/').replace(/\/$/, '');
    return joined || '/';
  }

  /* protected registerController<T>(opts: { controllerClass: IClass<T> }): void {
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
  } */

  /* protected registerRoute(opts: { controllerInstance: any; route: IRouteMetadata }): void {
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
  } */

  async registerComponents() {
    this.logger.info('[registerComponents] START | Register Application Components...');

    const components = this.findByTag<BaseComponent>({ tag: 'components' });
    for (const component of components) {
      const instance = component.getValue(this);
      await instance.configure();
    }

    this.logger.info('[registerComponents] DONE | Register Application Components...');
  }

  // ------------------------------------------------------------------------------
  override async initialize() {
    this.bind<IRestApplication>({ key: CoreBindings.APPLICATION_INSTANCE }).toProvider(() => this);
    this.bind<typeof this.server>({ key: CoreBindings.APPLICATION_SERVER }).toProvider(
      () => this.server,
    );

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

    await super.initialize();
    await this.registerComponents();
  }
}
