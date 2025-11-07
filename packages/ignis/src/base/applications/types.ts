import type { Context } from 'hono';

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
export type TCSRFOptions = {
  origin?: string | string[] | IsAllowedOriginHandler;
  secFetchSite?: SecFetchSite | SecFetchSite[] | IsAllowedSecFetchSiteHandler;
};

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
export interface IApplicationConfig {
  basePath?: string;
  compress?: boolean;

  cors?: ICORSOptions;
  bodyLimit?: TBodyLimitOptions;

  autoLoad: {
    dirs: Record<
      string, // folder name | namespace
      string // folder path from basePath
    >;
  };

  [key: string]: any;
}
