import { ValueOrPromise } from '@/common';
import { BaseHelper } from '../base.helper';
import { Binding } from '@/helpers/inversion';

export abstract class BaseComponent extends BaseHelper {
  protected bindings: Record<string | symbol, Binding>;

  constructor(opts: { scope: string }) {
    super(opts);
    this.bindings = {};
  }

  abstract binding(): ValueOrPromise<void>;

  protected async configure(): Promise<void> {
    const t = performance.now();
    this.logger.info('[binding] START | Binding health component');

    await this.binding();

    this.logger.info(
      '[binding] DONE | Binding health component | Took: %s (ms)',
      performance.now() - t,
    );
  }
}
