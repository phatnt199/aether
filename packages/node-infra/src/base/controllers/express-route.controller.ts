import { ValueOrPromise } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers/logger';
import { Context } from '@loopback/core';
import { ExpressRequestHandler, ExpressServer, ExpressServerConfig } from '@loopback/rest';

export abstract class AbstractExpressRequestHandler extends ExpressServer {
  protected logger: ApplicationLogger;

  constructor(opts: { scope: string; config?: ExpressServerConfig | undefined; context: Context }) {
    const { scope, config, context } = opts;
    super(config, context);

    this.logger = LoggerFactory.getLogger([scope]);

    this.binding();
  }

  getApplicationHandler() {
    return this.expressApp as ExpressRequestHandler;
  }

  abstract binding(): ValueOrPromise<void>;
}
