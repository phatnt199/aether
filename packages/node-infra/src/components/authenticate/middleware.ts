import { BaseProvider } from '@/base/base.provider';
import {
  AuthenticateFn,
  AUTHENTICATION_STRATEGY_NOT_FOUND,
  AuthenticationBindings,
  USER_PROFILE_NOT_FOUND,
} from '@loopback/authentication';
import { Getter, inject, injectable, Next, ValueOrPromise } from '@loopback/core';
import {
  asMiddleware,
  Middleware,
  MiddlewareContext,
  Request,
  RestMiddlewareGroups,
  RestTags,
} from '@loopback/rest';
import { AuthenticateKeys } from './common';

@injectable(
  asMiddleware({
    chain: RestTags.REST_MIDDLEWARE_CHAIN,
    group: RestMiddlewareGroups.AUTHENTICATION,
    upstreamGroups: [RestMiddlewareGroups.CORS],
  }),
)
export class AuthenticationMiddleware extends BaseProvider<Middleware> {
  constructor(
    @inject(AuthenticationBindings.AUTH_ACTION)
    private authenticateFn: AuthenticateFn,
    @inject.getter(AuthenticateKeys.ALWAYS_ALLOW_PATHS)
    private alwaysAllowPathGetter: Getter<string[]>,
  ) {
    super({ scope: AuthenticationMiddleware.name });
  }

  async authenticate(request: Request): Promise<void> {
    try {
      const { url = '' } = request;
      this.logger.debug(
        '[authenticate] Authenticating request | Url: %s',
        decodeURIComponent(url)?.replace(/(?:\r\n|\r|\n)/g, ''),
      );
      await this.authenticateFn(request);
    } catch (error) {
      const { code } = error || {};
      switch (code) {
        case AUTHENTICATION_STRATEGY_NOT_FOUND:
        case USER_PROFILE_NOT_FOUND: {
          Object.assign(error, { statusCode: 401 });
          break;
        }
        default: {
          this.logger.error('[authenticate] User request failed to authenticate | %s', error);
          break;
        }
      }

      throw error;
    }
  }

  value(): ValueOrPromise<Middleware> {
    return async (context: MiddlewareContext, next: Next) => {
      const t = new Date().getTime();

      const { request } = context;
      const { url } = request;
      const requestUrl = decodeURIComponent(url);
      const requestPath = requestUrl.slice(0, requestUrl.indexOf('?'));

      const alwaysAllowPaths = await this.alwaysAllowPathGetter();
      if (!alwaysAllowPaths.includes(requestPath)) {
        await this.authenticate(request);
      }

      this.logger.debug(
        '[handle] Authenticated request... | Took: %d(ms)',
        new Date().getTime() - t,
      );
      return next();
    };
  }
}
