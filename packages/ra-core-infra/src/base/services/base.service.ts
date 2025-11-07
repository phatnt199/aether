import { Logger } from '@/helpers';

export class BaseService {
  protected logger: Logger;

  constructor(opts: { scope: string }) {
    this.logger = Logger.getInstance({ scope: opts.scope });
  }
}
