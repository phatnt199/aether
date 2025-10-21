import { ValueOrPromise } from '@/common';
import { Logger } from '@/helpers';
import { Provider } from '@loopback/context';

export abstract class BaseProvider<T> implements Provider<T> {
  protected logger: Logger;

  constructor(opts: { scope: string }) {
    this.logger = new Logger({ scope: opts.scope });
  }

  abstract value(): ValueOrPromise<T>;
}
