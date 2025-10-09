import { MixinTarget } from '@loopback/core';
import { Entity, model, property } from '@loopback/repository';

export const SoftDeleteModelMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  @model()
  class Mixed extends superClass {
    @property({
      type: 'boolean',
      default: false,
      postgresql: {
        columnName: 'is_deleted',
        dataType: 'boolean',
      },
    })
    isDeleted?: boolean;
  }

  return Mixed;
};
