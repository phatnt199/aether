import { MixinTarget } from '@loopback/core';
import { Entity, model, property } from '@loopback/repository';

export const DataTypeMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  @model()
  class Mixed extends superClass {
    @property({
      type: 'string',
      postgresql: {
        columnName: 't_value',
        dataType: 'text',
      },
    })
    tValue?: string;

    @property({
      type: 'number',
      postgresql: { columnName: 'n_value' },
    })
    nValue?: number;

    @property({
      type: 'object',
      postgresql: {
        columnName: 'j_value',
        dataType: 'jsonb',
      },
    })
    jValue?: any;

    @property({
      type: 'array',
      itemType: 'number',
      postgresql: {
        columnName: 'b_value',
        dataType: 'jsonb',
      },
    })
    bValue?: Array<number>;

    @property({
      type: 'string',
      postgresql: {
        columnName: 'data_type',
        dataType: 'text',
      },
    })
    dataType?: string;
  }

  return Mixed;
};
