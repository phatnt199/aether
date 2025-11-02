import { BindingKeys, BindingNamespaces } from '@/common/bindings';
import { App as AppConstants } from '@/common/constants';
import type {
  IApplication,
  IClass,
  IDataSource,
  IEnvironmentValidationResult,
  IRepository,
  IService,
  ValueOrPromise,
} from '@/common/types';
import { applicationEnvironment } from '@/helpers/env';
import { Container, IRouteMetadata, MetadataRegistry } from '@/helpers/inversion';
import { getError } from '@/utilities/error.utility';
import { toBoolean } from '@/utilities/parse.utility';
import { serve } from '@hono/node-server';
import type { Context } from 'hono';
import { Hono } from 'hono';
import isEmpty from 'lodash/isEmpty';
import { IApplicationConfig } from './types';

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

export abstract class BaseApplication extends Container implements IApplication {
  protected servers: Array<Hono>;

  protected config: IApplicationConfig;
  protected projectRoot: string;

  protected models: Set<string>;

  // ------------------------------------------------------------------------------
  constructor(opts: { scope: string; config: IApplicationConfig }) {
    const { scope, config } = opts;
    super({ scope });

    this.config = {
      port: config.port || AppConstants.PORT,
      host: config.host || AppConstants.HOST,
      basePath: config.basePath || '/',
      ...config,
    };

    const server = new Hono().basePath(this.config.basePath);
    this.servers = [server];
  }

  // ------------------------------------------------------------------------------
  abstract staticConfigure(): void;
  abstract declareModels(): Set<string>;
  abstract preConfigure(): ValueOrPromise<void>;
  abstract postConfigure(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  validateEnv(): IEnvironmentValidationResult {
    const rs = { result: true, message: '' };
    const envKeys = applicationEnvironment.keys();

    for (const argKey of envKeys) {
      const argValue = applicationEnvironment.get<string | number>(argKey);

      if (toBoolean(process.env.ALLOW_EMPTY_ENV_VALUE) || !isEmpty(argValue)) {
        continue;
      }

      rs.result = false;
      rs.message = `Invalid Application Environment! Key: ${argKey} | Value: ${argValue}`;
    }

    return rs;
  }

  // ------------------------------------------------------------------------------
  controller<T>(ctor: IClass<T>): any {
    this.bind<T>(
      BindingKeys.build({
        namespace: BindingNamespaces.CONTROLLER,
        key: ctor.name,
      }),
    ).toClass(ctor);
    this.registerController(ctor);
    return this;
  }

  /* component<T>(ctor: IClass<T>): void {
    const instance = this.resolve(ctor);
    if (typeof (instance as any).init === 'function') {
      (instance as any).init(this);
    }
  } */

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
  getProjectRoot(): string {
    return process.cwd();
  }

  getMigrateModels(_opts: {
    ignoreModels?: string[];
    migrateModels?: string[];
  }): ValueOrPromise<Array<IRepository>> {
    // To be implemented
    return [];
  }

  migrateModels(_opts: {
    existingSchema: string;
    ignoreModels?: string[];
    migrateModels?: string[];
  }): ValueOrPromise<void> {
    // To be implemented
  }

  getServerHost() {
    return this.config.host || AppConstants.HOST;
  }

  getServerPort() {
    return this.config.port || AppConstants.PORT;
  }

  getServerAddress() {
    return `${this.getServerHost()}:${this.getServerPort()}`;
  }

  getServer() {
    return this.servers[0];
  }

  // ------------------------------------------------------------------------------
  protected normalizePath(...segments: string[]): string {
    const joined = segments.join('/').replace(/\/+/g, '/').replace(/\/$/, '');
    return joined || '/';
  }

  protected registerController<T>(controllerClass: IClass<T>): void {
    const routes = MetadataRegistry.getRouteMetadata(controllerClass);
    if (!routes || routes.length === 0) {
      return;
    }

    const controllerInstance = this.resolve(controllerClass);
    for (const route of routes) {
      this.registerRoute(controllerInstance, route);
    }
  }

  protected registerRoute(controllerInstance: any, route: IRouteMetadata): void {
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

  async initialize() {
    this.logger.info(
      '[initialize] ------------------------------------------------------------------------',
    );
    this.logger.info(
      '[initialize] Starting application... | Name: %s | Env: %s',
      APP_ENV_APPLICATION_NAME,
      NODE_ENV,
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
    // this.bind(BindingKeys.APPLICATION_MIDDLEWARE_OPTIONS).to(MiddlewareSequence.defaultOptions);
    // this.sequence(sequence ?? BaseApplicationSequence);

    this.staticConfigure();
    this.projectRoot = this.getProjectRoot();
    this.logger.info('[initialize] Project root: %s', this.projectRoot);
    // this.component(CrudRestComponent);

    this.logger.info('[initialize] Validating application environments...');
    const envValidation = this.validateEnv();
    if (!envValidation.result) {
      throw getError({ message: envValidation?.message ?? 'Invalid application environment!' });
    }
    this.logger.info('[initialize] All application environments are valid...');

    this.logger.info('[initialize] Declare application models...');
    this.models = new Set([]);
    this.models = this.declareModels();

    // this.logger.info('[initialize] Declare application middlewares...');
    // this.middleware(RequestBodyParserMiddleware);
    // this.middleware(RequestSpyMiddleware);

    this.logger.info('[initialize] Executing Pre-Configuration...');
    await this.preConfigure();

    this.logger.info('[initialize] Executing Post-Configuration...');
    await this.postConfigure();
  }

  // ------------------------------------------------------------------------------
  async start() {
    await this.initialize();

    const port = this.getServerPort();
    const host = this.getServerHost();
    const server = this.getServer();

    serve(
      {
        fetch: server.fetch,
        hostname: host,
        port,
        autoCleanupIncoming: true,
      },
      info => {
        this.logger.info('[start][serve] Server is now running...', APP_ENV_APPLICATION_NAME);
        this.logger.info('[start][serve] Server started: %s', this.getServerAddress());
        this.logger.info('[start][serve] Info: %j', info);
        this.logger.info('[start][serve] Log folder: %s', APP_ENV_LOGGER_FOLDER_PATH);
      },
    );
  }

  async stop(): Promise<void> {
    this.logger.info('[stop] Server STOPPED');
  }
}
