import { Provider } from '@loopback/context';

import { ValueOrPromise } from '@/common';
import { Logger } from '@/helpers';

export abstract class BaseProvider<T> implements Provider<T> {
  protected logger: Logger;

  constructor(opts: { scope: string }) {
    this.logger = new Logger({ scope: opts.scope });
  }

  abstract value(): ValueOrPromise<T>;
}
