import { Container, TClass } from '@venizia/ignis-inversion';

import { ICoreRaApplication, ValueOrPromise } from '@/common';

// --------------------------------------------------------------------------------
export abstract class AbstractRaApplication extends Container implements ICoreRaApplication {
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
  injectable<T>(scope: string, value: TClass<T>, tags?: Array<string>) {
    this.bind({ key: `${scope}.${value.name}` })
      .toClass(value)
      .setTags(...(tags ?? []));
  }

  // ------------------------------------------------------------------------------
  service<T>(value: TClass<T>) {
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
