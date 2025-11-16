import { AnyObject, IClass, ValueOrPromise } from '@/common/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { IPRestrictionRules as IIPRestrictionRules } from 'hono/ip-restriction';
import { BaseComponent } from '../components';
import { IDataSource } from '../datasources';
import { IRepository } from '../repositories';
import { IService } from '../services';

// ------------------------------------------------------------------------------
export interface IMiddlewareOptions {
  enable: boolean;
  path?: string;
}

// ------------------------------------------------------------------------------
// CORS Middleware Options
// ------------------------------------------------------------------------------
export interface ICORSOptions extends IMiddlewareOptions {
  origin:
    | string
    | string[]
    | ((
        origin: string,
        c: Context,
      ) => Promise<string | undefined | null> | string | undefined | null);
  allowMethods?: string[] | ((origin: string, c: Context) => Promise<string[]> | string[]);
  allowHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
  exposeHeaders?: string[];
}

// ------------------------------------------------------------------------------
// CSRF Middleware Options
// ------------------------------------------------------------------------------
export type TIsAllowedOriginHandler = (origin: string, context: Context) => boolean;
export const SecFetchSiteValues = ['same-origin', 'same-site', 'none', 'cross-site'] as const;
export type TSecFetchSite = (typeof SecFetchSiteValues)[number];
export type TIsAllowedSecFetchSiteHandler = (
  secFetchSite: TSecFetchSite,
  context: Context,
) => boolean;

export interface ICSRFOptions extends IMiddlewareOptions {
  origin?: string | string[] | TIsAllowedOriginHandler;
  secFetchSite?: TSecFetchSite | TSecFetchSite[] | TIsAllowedSecFetchSiteHandler;
}

// ------------------------------------------------------------------------------
// Body Limit Middleware Options
// ------------------------------------------------------------------------------
export interface IBodyLimitOptions extends IMiddlewareOptions {
  maxSize: number;
  onError?: (c: Context) => Response | Promise<Response>;
}

// ------------------------------------------------------------------------------
// Compress Middleware Options
// ------------------------------------------------------------------------------
export interface ICompressOptions extends IMiddlewareOptions {
  encoding: 'gzip' | 'deflate';
  threshold?: number;
}

// ------------------------------------------------------------------------------
// RequestId Middleware Options
// ------------------------------------------------------------------------------
export interface IRequestIdOptions extends IMiddlewareOptions {}

// ------------------------------------------------------------------------------
// Application
// ------------------------------------------------------------------------------
export type TBunServerInstance = ReturnType<typeof Bun.serve>;
export type TNodeServerInstance = any; // Will be set at runtime from @hono/node-server

// ------------------------------------------------------------------------------
export interface IApplicationConfig {
  host?: string;
  port?: number;

  path: { base: string; isStrict: boolean };

  middlewares: {
    compress?: ICompressOptions;
    cors?: ICORSOptions;
    csrf?: ICSRFOptions;
    bodyLimit?: IBodyLimitOptions;
    requestId?: IRequestIdOptions;
    ipRestriction?: IMiddlewareOptions & IIPRestrictionRules;
  };

  autoLoad?: {
    dirs: Record<
      string, // folder name | namespace
      string // folder path from basePath
    >;
  };

  debug?: {
    showRoutes?: boolean;
  };

  [key: string]: any;
}

// ------------------------------------------------------------------------------
export interface IApplication {
  initialize(): ValueOrPromise<void>;

  staticConfigure(): void;
  setupMiddlewares(opts?: { middlewares?: Record<string | symbol, any> }): ValueOrPromise<void>;
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;

  getProjectConfigs(): IApplicationConfig;
  getProjectRoot(): string;
  getRootRouter(): OpenAPIHono;
  getServerHost(): string;
  getServerPort(): number;
  getServerAddress(): string;
  getApplicationVersion(): ValueOrPromise<string>;

  start(): ValueOrPromise<void>;
  stop(): ValueOrPromise<void>;
}

// ------------------------------------------------------------------------------
export interface IRestApplication extends IApplication {
  component<T extends BaseComponent = any, O extends AnyObject = AnyObject>(
    ctor: IClass<T>,
    args?: O,
  ): IApplication;
  controller<T>(ctor: IClass<T>): IApplication;
  repository<T extends IRepository>(ctor: IClass<T>): IApplication;
  service<T extends IService>(ctor: IClass<T>): IApplication;
  dataSource<T extends IDataSource>(ctor: IClass<T>): IApplication;
  static(opts: { restPath?: string; folderPath: string }): IApplication;

  registerComponents(): ValueOrPromise<void>;
}
