import { MixinTarget } from '@loopback/core';
import { Entity, model, property } from '@loopback/repository';

export const TextSearchMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  @model()
  class Mixed extends superClass {
    @property({
      type: 'string',
      hidden: true,
      postgresql: {
        columnName: 'text_search',
        dataType: 'text',
      },
    })
    textSearch?: string;
  }

  return Mixed;
};
