import { LoggerFactory, ApplicationLogger } from '@/helpers';
import { Provider, ValueOrPromise } from '@loopback/core';

export abstract class BaseProvider<T> implements Provider<T> {
  protected logger: ApplicationLogger;

  constructor(opts: { scope: string }) {
    this.logger = LoggerFactory.getLogger([opts?.scope ?? BaseProvider.name]);
  }

  abstract value(): ValueOrPromise<T>;
}
