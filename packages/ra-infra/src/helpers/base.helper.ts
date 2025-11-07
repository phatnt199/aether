import { Logger } from './logger.helper';

export class BaseHelper {
  protected logger: Logger;

  constructor(opts: { scope: string }) {
    this.logger = Logger.getInstance({ scope: opts.scope });
  }
}
