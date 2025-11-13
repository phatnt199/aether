import { AnyObject, IClass, ValueOrPromise } from '@/common/types';
import type { Context } from 'hono';
import { IPRestrictionRules as IIPRestrictionRules } from 'hono/ip-restriction';
import { BaseComponent } from '../components';
import { IDataSource } from '../datasources';
import { IRepository } from '../repositories';
import { IService } from '../services';

// ------------------------------------------------------------------------------
// CORS Options
// ------------------------------------------------------------------------------
export interface ICORSOptions {
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
// CSRF Options
// ------------------------------------------------------------------------------
export type TIsAllowedOriginHandler = (origin: string, context: Context) => boolean;
export const SecFetchSiteValues = ['same-origin', 'same-site', 'none', 'cross-site'];
export type TSecFetchSite = (typeof SecFetchSiteValues)[number];
export type TIsAllowedSecFetchSiteHandler = (
  secFetchSite: TSecFetchSite,
  context: Context,
) => boolean;

export interface ICSRFOptions {
  origin?: string | string[] | TIsAllowedOriginHandler;
  secFetchSite?: TSecFetchSite | TSecFetchSite[] | TIsAllowedSecFetchSiteHandler;
}

// ------------------------------------------------------------------------------
// Body Limit Options
// ------------------------------------------------------------------------------
export interface IBodyLimitOptions {
  maxSize: number;
  onError?: (c: Context) => Response | Promise<Response>;
}

// ------------------------------------------------------------------------------
// Application
// ------------------------------------------------------------------------------
export type TBunServerInstance = ReturnType<typeof Bun.serve>;
export type TNodeServerInstance = any; // Will be set at runtime from @hono/node-server

// ------------------------------------------------------------------------------
export interface IApplicationConfig {
  host?: string;
  port?: number;
  basePath?: string;
  strictPath?: boolean;

  compress?: boolean;

  cors?: ICORSOptions;
  csrf?: ICSRFOptions;
  bodyLimit?: IBodyLimitOptions;

  ipRestriction?: IIPRestrictionRules;

  autoLoad: {
    dirs: Record<
      string, // folder name | namespace
      string // folder path from basePath
    >;
  };

  [key: string]: any;
}

// ------------------------------------------------------------------------------
export interface IApplication {
  initialize(): ValueOrPromise<void>;

  staticConfigure(): void;
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;

  getProjectConfigs(): IApplicationConfig;
  getProjectRoot(): string;
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
