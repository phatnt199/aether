import { App as AppConstants } from '@/common/constants';
import { CoreBindings } from '@/common/bindings';
import type {
  ClassType,
  IApplication,
  IDataSource,
  IRepository,
  IService,
  ValueOrPromise,
} from '@/common/types';
import { Container, globalContainer } from '@/core/container';
import { MetadataRegistry } from '@/core/metadata';
import { ParameterType } from '@/core/metadata/constants';
import type { IParameterMetadata, IRouteMetadata } from '@/core/metadata/types';
import { serve } from '@hono/node-server';
import type { Context } from 'hono';
import { Hono } from 'hono';

/**
 * Application configuration
 */
export interface ApplicationConfig {
  port?: number;
  host?: string;
  basePath?: string;
  cors?: boolean;
  [key: string]: any;
}

export class BaseApplication implements IApplication {
  protected hono: Hono;
  protected container: Container;
  protected config: ApplicationConfig;
  protected controllers: Set<ClassType<any>> = new Set();
  protected components: Set<ClassType<any>> = new Set();
  protected datasources: Map<string, IDataSource> = new Map();

  public models: Set<string> = new Set();

  constructor(config: ApplicationConfig = {}) {
    this.config = {
      port: config.port || AppConstants.PORT,
      host: config.host || AppConstants.HOST,
      basePath: config.basePath || '/',
      ...config,
    };

    this.hono = new Hono();
    this.container = globalContainer.createChild();

    // Bind self to container
    this.container.registerValue(CoreBindings.APPLICATION_INSTANCE, this);
    this.container.registerValue(CoreBindings.APPLICATION_CONFIG, this.config);
  }

  /**
   * Register a controller class
   */
  controller<T>(ctor: ClassType<T>, nameOrOptions?: string | any): any {
    this.controllers.add(ctor);

    // Register controller in DI container
    const name = typeof nameOrOptions === 'string' ? nameOrOptions : ctor.name;
    this.container.register(`controllers.${name}`, ctor);

    return this;
  }

  /**
   * Register a component
   */
  component<T>(ctor: ClassType<T>): void {
    this.components.add(ctor);

    // Instantiate and initialize component
    const instance = this.container.resolve(ctor);
    if (typeof (instance as any).init === 'function') {
      (instance as any).init(this);
    }
  }

  /**
   * Register a repository
   */
  repository<T extends IRepository>(ctor: ClassType<T>): void {
    this.container.register(`repositories.${ctor.name}`, ctor);
  }

  /**
   * Register a service
   */
  service<T extends IService>(ctor: ClassType<T>): void {
    this.container.register(`services.${ctor.name}`, ctor);
  }

  /**
   * Register a datasource
   */
  dataSource(ds: IDataSource): void {
    this.datasources.set(ds.name, ds);
    this.container.registerValue(`datasources.${ds.name}`, ds);
  }

  /**
   * Get datasource synchronously
   */
  getDatasourceSync<T extends IDataSource>(dsName: string): T {
    const ds = this.datasources.get(dsName);
    if (!ds) {
      throw new Error(`Datasource not found: ${dsName}`);
    }
    return ds as T;
  }

  /**
   * Get repository synchronously
   */
  getRepositorySync<T extends IRepository>(c: ClassType<T>): T {
    return this.container.getSync<T>(`repositories.${c.name}`);
  }

  /**
   * Get service synchronously
   */
  getServiceSync<T extends IService>(c: ClassType<T>): T {
    return this.container.getSync<T>(`services.${c.name}`);
  }

  /**
   * Get from container by key
   */
  getSync<T>(key: string | symbol): T {
    return this.container.getSync<T>(key);
  }

  /**
   * Bind a value to the container
   */
  bind<T>(key: string | symbol) {
    return this.container.bind<T>(key);
  }

  /**
   * Initialize application
   */
  async initialize(): Promise<void> {
    await this.preConfigure();

    // Register all controllers and their routes
    for (const controllerClass of this.controllers) {
      this.registerController(controllerClass);
    }

    await this.postConfigure();
  }

  /**
   * Register controller and generate routes
   */
  protected registerController(controllerClass: ClassType<any>): void {
    // Get controller metadata
    const controllerMetadata = MetadataRegistry.getControllerMetadata(controllerClass);
    const basePath = controllerMetadata?.basePath || '/';

    // Get all route metadata
    const routes = MetadataRegistry.getRouteMetadata(controllerClass);

    if (!routes || routes.length === 0) {
      return;
    }

    // Create controller instance
    const controllerInstance = this.container.resolve(controllerClass);

    // Register each route
    for (const route of routes) {
      this.registerRoute(controllerInstance, route, basePath);
    }
  }

  /**
   * Register a single route
   */
  protected registerRoute(controllerInstance: any, route: IRouteMetadata, basePath: string): void {
    const fullPath = this.normalizePath(basePath, route.path);
    const method = route.method.toLowerCase();
    const methodName = route.methodName;

    // Get parameter metadata
    const paramMetadata =
      MetadataRegistry.getParameterMetadata(controllerInstance, methodName) || [];

    // Sort parameters by index
    paramMetadata.sort((a, b) => a.index - b.index);

    // Create route handler
    const handler = async (c: Context) => {
      try {
        // Bind context to container
        c.set('container', this.container);
        c.set('application', this);

        // Extract parameters
        const args = await this.extractParameters(c, paramMetadata);

        // Call controller method
        const result = await controllerInstance[methodName](...args);

        // Return response
        return c.json(result);
      } catch (error: any) {
        return c.json(
          {
            error: {
              message: error.message || 'Internal Server Error',
              statusCode: error.statusCode || 500,
            },
          },
          error.statusCode || 500,
        );
      }
    };

    // Register with Hono
    (this.hono as any)[method](fullPath, handler);

    console.log(`Registered route: ${route.method} ${fullPath} -> ${String(methodName)}`);
  }

  /**
   * Extract parameters from context based on metadata
   */
  protected async extractParameters(
    ctx: Context,
    paramMetadata: IParameterMetadata[],
  ): Promise<any[]> {
    const args: any[] = [];

    for (const param of paramMetadata) {
      if (param.extractor) {
        args[param.index] = await param.extractor(ctx);
      } else {
        switch (param.type) {
          case ParameterType.PATH:
            args[param.index] = param.name ? ctx.req.param(param.name) : ctx.req.param();
            break;
          case ParameterType.QUERY:
            args[param.index] = param.name ? ctx.req.query(param.name) : ctx.req.query();
            break;
          case ParameterType.HEADER:
            args[param.index] = param.name ? ctx.req.header(param.name) : ctx.req.header();
            break;
          case ParameterType.BODY:
            try {
              args[param.index] = await ctx.req.json();
            } catch {
              args[param.index] = await ctx.req.parseBody();
            }
            break;
          case ParameterType.REQUEST:
            args[param.index] = ctx.req;
            break;
          case ParameterType.RESPONSE:
            args[param.index] = ctx;
            break;
          case ParameterType.CONTEXT:
            args[param.index] = ctx;
            break;
          default:
            args[param.index] = undefined;
        }
      }
    }

    return args;
  }

  /**
   * Normalize path segments
   */
  protected normalizePath(...segments: string[]): string {
    const joined = segments.join('/').replace(/\/+/g, '/').replace(/\/$/, '');
    return joined || '/';
  }

  /**
   * Lifecycle hooks
   */
  staticConfigure(): void {
    // Override in subclass
  }

  async preConfigure(): Promise<void> {
    // Override in subclass
  }

  async postConfigure(): Promise<void> {
    // Override in subclass
  }

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

  /**
   * Get server configuration
   */
  getServerHost(): string {
    return this.config.host || AppConstants.HOST;
  }

  getServerPort(): number {
    return this.config.port || AppConstants.PORT;
  }

  getServerAddress(): string {
    return `http://${this.getServerHost()}:${this.getServerPort()}`;
  }

  /**
   * Get underlying Hono instance
   */
  getHono(): Hono {
    return this.hono;
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    await this.initialize();

    const port = this.getServerPort();
    const host = this.getServerHost();

    serve(
      {
        fetch: this.hono.fetch,
        port,
        hostname: host,
      },
      info => {
        console.log('Server started at %s', this.getServerAddress());
        console.log('[serve] Info: ', info);
      },
    );
  }

  /**
   * Stop the application
   */
  async stop(): Promise<void> {
    // Cleanup logic
    console.log('Server stopped');
  }
}

/**
 * Application class alias
 */
export class Application extends BaseApplication {}
