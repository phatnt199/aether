import { TInjectionGetter, ValueOrPromise } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers/logger';
import { Context } from '@loopback/core';
import { ExpressRequestHandler, ExpressServer, ExpressServerConfig } from '@loopback/rest';

export abstract class AbstractExpressRequestHandler extends ExpressServer {
  protected logger: ApplicationLogger;
  protected injectionGetter: TInjectionGetter;

  constructor(opts: {
    scope: string;
    config?: ExpressServerConfig | undefined;
    context?: Context;
    injectionGetter: TInjectionGetter;
  }) {
    const { scope, config, context } = opts;
    super(config, context);

    this.logger = LoggerFactory.getLogger([scope]);
    this.injectionGetter = opts.injectionGetter;
  }

  getApplicationHandler() {
    return this.expressApp as ExpressRequestHandler;
  }

  abstract binding(): ValueOrPromise<void>;
}
