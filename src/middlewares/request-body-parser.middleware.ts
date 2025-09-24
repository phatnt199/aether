import { injectable, Next, ValueOrPromise } from '@loopback/core';
import {
  asMiddleware,
  Middleware,
  MiddlewareContext,
  RestMiddlewareGroups,
  RestTags,
  UrlEncodedBodyParser,
} from '@loopback/rest';

import { BaseProvider } from '@/base/base.provider';

import set from 'lodash/set';

@injectable(
  asMiddleware({
    chain: RestTags.REST_MIDDLEWARE_CHAIN,
    group: RestMiddlewareGroups.FIND_ROUTE,
  }),
)
export class RequestBodyParserMiddleware extends BaseProvider<Middleware> {
  constructor() {
    super({ scope: RequestBodyParserMiddleware.name });
  }

  handle(context: MiddlewareContext) {
    return new Promise((resolve, reject) => {
      const { request } = context;

      const contentType = request.headers['content-type']?.toLowerCase();
      switch (contentType) {
        case 'application/x-www-form-urlencoded': {
          const urlencoded = new UrlEncodedBodyParser({
            urlencoded: { extended: true },
          });
          urlencoded
            .parse(request)
            .then(rs => {
              set(request, 'body', rs.value);
              resolve(request);
            })
            .catch(reject);
          break;
        }
        default: {
          resolve(request);
          break;
        }
      }
    });
  }

  async middleware(context: MiddlewareContext, next: Next) {
    await this.handle(context);
    return next();
  }

  value(): ValueOrPromise<Middleware> {
    return (context: MiddlewareContext, next: Next) => {
      return this.middleware(context, next);
    };
  }
}
