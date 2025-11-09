import type { Context } from 'hono';
import { IPRestrictionRules as IIPRestrictionRules } from 'hono/ip-restriction';

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
