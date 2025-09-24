import { BaseProvider } from '@/base/base.provider';
import { getUID } from '@/utilities/parse.utility';
import { injectable, Next, ValueOrPromise } from '@loopback/core';
import {
  asMiddleware,
  Middleware,
  MiddlewareContext,
  RestMiddlewareGroups,
  RestTags,
} from '@loopback/rest';

import set from 'lodash/set';

@injectable(
  asMiddleware({
    chain: RestTags.REST_MIDDLEWARE_CHAIN,
    group: RestMiddlewareGroups.FIND_ROUTE,
  }),
)
export class RequestSpyMiddleware extends BaseProvider<Middleware> {
  constructor() {
    super({ scope: RequestSpyMiddleware.name });
  }

  handle(context: MiddlewareContext) {
    try {
      const { request } = context;

      const requestId = getUID();
      set(request, 'requestId', requestId);

      const { url = '', method, body, query, path, headers } = request;
      const requestUrl = decodeURIComponent(url)?.replace(/(?:\r\n|\r|\n| )/g, '');
      const requestedRemark = {
        id: requestId,
        url: requestUrl,
        method,
        path: path ?? 'N/A',
        query: query ?? 'N/A',
        body,
      };
      set(request, 'requestedRemark', requestedRemark);

      const requestForwardedIp = headers['x-real-ip'] ?? headers['x-forwarded-for'] ?? 'N/A';
      set(request, 'requestForwardedIp', requestForwardedIp);

      this.logger.info(
        '[spy][%s] Request Information | forwardedIp: %s | remark: %j',
        requestId,
        requestForwardedIp,
        requestedRemark,
      );
    } catch (error) {
      this.logger.error('[spy] Failed to spy request information | Error: %s', error);
    }
  }

  value(): ValueOrPromise<Middleware> {
    return (context: MiddlewareContext, next: Next) => {
      this.handle(context);
      return next();
    };
  }
}
