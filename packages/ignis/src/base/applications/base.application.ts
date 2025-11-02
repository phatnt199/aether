import { CoreBindings } from '@/common/bindings';
import { App as AppConstants } from '@/common/constants';
import type {
  IApplication,
  IClass,
  IController,
  IDataSource,
  IRepository,
  IService,
  ValueOrPromise,
} from '@/common/types';
import { serve } from '@hono/node-server';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { BaseHelper } from '../base.helper';

/**
 * Application configuration
 */
export interface ApplicationConfig {
  scope: string;
  port?: number;
  host?: string;
  basePath?: string;
  cors?: boolean;
  [key: string]: any;
}

// export const global = new Container({ scope: 'global' });

export class BaseApplication extends BaseHelper implements IApplication {
  protected hono: Hono;

  protected config: ApplicationConfig;

  models: Set<string> = new Set();

  protected controllers: Set<IClass<IController>> = new Set();
  protected components: Set<IClass<IService>> = new Set();

  protected datasources: Map<string, IDataSource> = new Map();

  constructor(config: ApplicationConfig) {
    super({ scope: config.scope });

    this.config = {
      port: config.port || AppConstants.PORT,
      host: config.host || AppConstants.HOST,
      basePath: config.basePath || '/',
      ...config,
    };

    this.hono = new Hono();
  }

  controller<T>(ctor: IClass<T>, _nameOrOptions?: string): any {
    this.controllers.add(ctor);

    // Register controller in DI container
    // const name = typeof nameOrOptions === 'string' ? nameOrOptions : ctor.name;
    // this.register(`controllers.${name}`, ctor);

    return this;
  }

  component<T>(ctor: IClass<T>): void {
    this.components.add(ctor);

    // Instantiate and initialize component
    const instance = this.resolve(ctor);
    if (typeof (instance as any).init === 'function') {
      (instance as any).init(this);
    }
  }

  repository<T extends IRepository>(ctor: IClass<T>): void {
    this.register(`repositories.${ctor.name}`, ctor);
  }

  service<T extends IService>(ctor: IClass<T>): void {
    this.register(`services.${ctor.name}`, ctor);
  }

  dataSource(ds: IDataSource): void {
    this.datasources.set(ds.name, ds);
    this.registerValue(`datasources.${ds.name}`, ds);
  }

  getSync<T>(key: string | symbol): T {
    return this.getSync<T>(key);
  }

  bind<T>(key: string | symbol) {
    return this.bind<T>(key);
  }

  async initialize(): Promise<void> {
    await this.preConfigure();

    // Register all controllers and their routes
    for (const controllerClass of this.controllers) {
      this.registerController(controllerClass);
    }

    await this.postConfigure();
  }

  protected registerController(controllerClass: IClass<any>): void {
    // Get controller metadata
    const controllerMetadata = MetadataRegistry.getControllerMetadata(controllerClass);
    const basePath = controllerMetadata?.basePath || '/';

    // Get all route metadata
    const routes = MetadataRegistry.getRouteMetadata(controllerClass);

    if (!routes || routes.length === 0) {
      return;
    }

    // Create controller instance
    const controllerInstance = this.resolve(controllerClass);

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

  getServerHost(): string {
    return this.config.host || AppConstants.HOST;
  }

  getServerPort(): number {
    return this.config.port || AppConstants.PORT;
  }

  getServerAddress(): string {
    return `http://${this.getServerHost()}:${this.getServerPort()}`;
  }

  getServer(): Hono {
    return this.hono;
  }

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

  async stop(): Promise<void> {
    console.log('Server stopped');
  }
}

export class Application extends BaseApplication {}
