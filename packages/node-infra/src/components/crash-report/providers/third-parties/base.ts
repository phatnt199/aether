import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { ICrashReportProvider, ISendReport } from '../../common';
import { ValueOrPromise } from '@/common';

export abstract class AbstractCrashReportProvider implements ICrashReportProvider {
  abstract sendReport(opts: ISendReport): ValueOrPromise<void>;
}

export abstract class BaseCrashReportProvider extends AbstractCrashReportProvider {
  protected logger: ApplicationLogger;

  constructor(opts?: { scope?: string }) {
    super();
    this.logger = LoggerFactory.getLogger([opts?.scope ?? BaseCrashReportProvider.name]);
  }
}
