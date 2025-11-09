import { ApplicationLogger, LoggerFactory } from '@/helpers/logger';

export class BaseHelper {
  protected identifier: string;
  protected logger: ApplicationLogger;

  constructor(opts: { scope: string; identifier?: string }) {
    this.logger = LoggerFactory.getLogger(
      [opts.scope, opts.identifier ?? ''].filter(el => el && el.length > 0),
    );
    this.identifier = opts.identifier ?? '';
  }
}
