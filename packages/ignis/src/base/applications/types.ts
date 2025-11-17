import { AnyObject, IClass, ValueOrPromise } from '@/common/types';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { IPRestrictionRules as IIPRestrictionRules } from 'hono/ip-restriction';
import { BaseComponent } from '../components';
import { IDataSource } from '../datasources';
import { IRepository } from '../repositories';
import { IService } from '../services';

// ------------------------------------------------------------------------------
// Common Middleware Options
// ------------------------------------------------------------------------------
export interface IBaseMiddlewareOptions {
  enable: boolean;
  path?: string;
}

// ------------------------------------------------------------------------------
// Compress Middleware Options
// ------------------------------------------------------------------------------
export interface ICompressOptions extends IBaseMiddlewareOptions {
  encoding: 'gzip' | 'deflate';
  threshold?: number;
}

// ------------------------------------------------------------------------------
// CORS Middleware Options
// ------------------------------------------------------------------------------
export type TOrigin =
  | string
  | string[]
  | ((
      origin: string,
      c: Context,
    ) => Promise<string | undefined | null> | string | undefined | null);
export interface ICORSOptions extends IBaseMiddlewareOptions {
  origin: TOrigin;
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

export interface ICSRFOptions extends IBaseMiddlewareOptions {
  origin?: string | string[] | TIsAllowedOriginHandler;
  secFetchSite?: TSecFetchSite | TSecFetchSite[] | TIsAllowedSecFetchSiteHandler;
}

// ------------------------------------------------------------------------------
// Body Limit Middleware Options
// ------------------------------------------------------------------------------
export interface IBodyLimitOptions extends IBaseMiddlewareOptions {
  maxSize: number;
  onError?: (c: Context) => Response | Promise<Response>;
}

// ------------------------------------------------------------------------------
// RequestId Middleware Options
// ------------------------------------------------------------------------------
export interface IRequestIdOptions extends IBaseMiddlewareOptions {}

// ------------------------------------------------------------------------------
// Application
// ------------------------------------------------------------------------------
export type TBunServerInstance = ReturnType<typeof Bun.serve>;
export type TNodeServerInstance = any; // Will be set at runtime from @hono/node-server

// ------------------------------------------------------------------------------
export interface IMiddlewareConfigs {
  compress?: ICompressOptions;
  cors?: ICORSOptions;
  csrf?: ICSRFOptions;
  bodyLimit?: IBodyLimitOptions;
  requestId?: IRequestIdOptions;
  ipRestriction?: IBaseMiddlewareOptions & IIPRestrictionRules;
  [extra: string | symbol]: IBaseMiddlewareOptions;
}

export interface IApplicationConfigs {
  host?: string;
  port?: number;
  path: { base: string; isStrict: boolean };

  middlewares: IMiddlewareConfigs;

  autoLoad?: {
    dirs: {
      [key: string | symbol]: { path: string };
    };
  };

  debug?: {
    showRoutes?: boolean;
  };

  [key: string]: any;
}

// ------------------------------------------------------------------------------
export interface IApplication {
  initialize(): ValueOrPromise<void>;

  staticConfigure(): ValueOrPromise<void>;
  setupMiddlewares(): ValueOrPromise<void>;
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;

  getProjectConfigs(): IApplicationConfigs;
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
