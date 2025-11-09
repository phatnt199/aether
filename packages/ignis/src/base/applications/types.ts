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
type IsAllowedOriginHandler = (origin: string, context: Context) => boolean;
declare const secFetchSiteValues: readonly ['same-origin', 'same-site', 'none', 'cross-site'];
type SecFetchSite = (typeof secFetchSiteValues)[number];
type IsAllowedSecFetchSiteHandler = (secFetchSite: SecFetchSite, context: Context) => boolean;

export interface ICSRFOptions {
  origin?: string | string[] | IsAllowedOriginHandler;
  secFetchSite?: SecFetchSite | SecFetchSite[] | IsAllowedSecFetchSiteHandler;
}

// ------------------------------------------------------------------------------
// Body Limit Options
// ------------------------------------------------------------------------------
export interface TBodyLimitOptions {
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
  bodyLimit?: TBodyLimitOptions;

  ipRestriction?: IIPRestrictionRules;

  autoLoad: {
    dirs: Record<
      string, // folder name | namespace
      string // folder path from basePath
    >;
  };

  [key: string]: any;
}
