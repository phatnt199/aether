import { inject } from '@loopback/core';
import {
  InvokeMiddleware,
  InvokeMiddlewareOptions,
  RequestContext,
  SequenceActions,
  SequenceHandler,
} from '@loopback/rest';

import { BindingKeys } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getExecutedPerformance, getRequestId, getRequestRemark } from '@/utilities';

export class BaseApplicationSequence implements SequenceHandler {
  protected logger: ApplicationLogger;

  constructor(
    @inject(SequenceActions.INVOKE_MIDDLEWARE)
    protected invokeMiddleware: InvokeMiddleware,

    @inject(BindingKeys.APPLICATION_MIDDLEWARE_OPTIONS)
    protected middlewareOptions: InvokeMiddlewareOptions,
  ) {
    this.logger = LoggerFactory.getLogger([BaseApplicationSequence.name]);
  }

  // ----------------------------------------------------------------------------------------
  async handle(context: RequestContext) {
    const t = performance.now();
    const { request } = context;

    try {
      await this.invokeMiddleware(context, this.middlewareOptions);
    } catch (error) {
      const requestId = getRequestId({ request });
      this.logger.error('[handle][%s] ERROR | Error: %s', requestId, error);
    } finally {
      const requestedRemark = getRequestRemark({ request });
      this.logger.info(
        '[handle][%s] DONE | Took: %d(ms) | Url: %s',
        requestedRemark?.id,
        getExecutedPerformance({ from: t, digit: 6 }),
        requestedRemark?.url,
      );
    }
  }
}
