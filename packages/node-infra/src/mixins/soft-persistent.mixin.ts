import { MixinTarget } from '@loopback/core';
import { Entity, property } from '@loopback/repository';

export const SoftPersistentMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  class Mixed extends superClass {
    @property({
      type: 'number',
      postgresql: {
        columnName: 'persistent_state',
        dataType: 'integer',
      },
    })
    persistentState?: number; // This number can describe state value more than just deleted or not
  }

  return Mixed;
};
