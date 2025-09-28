import { AnyObject } from '@/common';
import { MixinTarget } from '@loopback/core';
import { Entity, model, property } from '@loopback/repository';

export const ObjectSearchMixin = <E extends MixinTarget<Entity>, T extends object = AnyObject>(
  superClass: E,
) => {
  @model()
  class Mixed extends superClass {
    @property({
      type: 'object',
      hidden: true,
      postgresql: {
        columnName: 'object_search',
        dataType: 'jsonb',
      },
    })
    objectSearch?: T;
  }

  return Mixed;
};
