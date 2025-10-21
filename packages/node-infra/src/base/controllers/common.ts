import { Filter } from '@loopback/repository';

import { App, IController } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { BaseEntity } from '../models';

// --------------------------------------------------------------------------------------------------------------
export const applyLimit = <E extends BaseEntity>(filter?: Filter<E>) => {
  const rs: Filter<E> = {
    ...(filter ?? {}),
  };

  rs['limit'] = rs['limit'] ?? App.DEFAULT_QUERY_LIMIT;
  return rs;
};

// --------------------------------------------------------------------------------------------------------------
export class BaseController implements IController {
  logger: ApplicationLogger;
  defaultLimit: number = App.DEFAULT_QUERY_LIMIT;

  constructor(opts: { scope?: string; defaultLimit?: number }) {
    this.logger = LoggerFactory.getLogger([opts?.scope ?? BaseController.name]);
    this.defaultLimit = opts?.defaultLimit ?? App.DEFAULT_QUERY_LIMIT;
  }
}
