import { IRaApplication, ValueOrPromise } from '@/common';
import {
  BindingTag,
  Constructor,
  Context,
  DynamicValueProviderClass,
} from '@loopback/context';

// --------------------------------------------------------------------------------
export abstract class AbstractRaApplication extends Context implements IRaApplication {
  abstract bindContext(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  // Context Binding
  // ------------------------------------------------------------------------------
  preConfigure(): ValueOrPromise<void> {
    this.bindContext();
  }

  // ------------------------------------------------------------------------------
  postConfigure(): ValueOrPromise<void> {}

  // ------------------------------------------------------------------------------
  injectable<T>(
    scope: string,
    value: DynamicValueProviderClass<T> | Constructor<T>,
    tags?: BindingTag[],
  ) {
    this.bind(`${scope}.${value.name}`)
      .toInjectable(value)
      .tag(...(tags ?? []), scope);
  }

  // ------------------------------------------------------------------------------
  /* provider<T>(value: DynamicValueProviderClass<T> | Constructor<T>) {
    this.injectable('providers', value);
  } */

  // ------------------------------------------------------------------------------
  service<T>(value: DynamicValueProviderClass<T> | Constructor<T>) {
    this.injectable('services', value);
  }

  // ------------------------------------------------------------------------------
  async start() {
    await this.preConfigure();
    await this.postConfigure();
  }
}

// --------------------------------------------------------------------------------
export abstract class BaseRaApplication extends AbstractRaApplication {}
