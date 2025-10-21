import { BaseEntity } from '@/base/models';
import { IdType } from '@/common';
import { MixinTarget } from '@loopback/core';
import { model, property } from '@loopback/repository';

export const DuplicatableMixin = <E extends MixinTarget<BaseEntity>>(
  superClass: E,
  opts: {
    idType: 'string' | 'number';
  },
) => {
  // const sourceIdType = getIdType(BaseNumberIdEntity);

  @model()
  class Mixed extends superClass {
    @property({
      type: opts.idType,
      postgresql: {
        columnName: 'source_id',
        dataType: opts.idType === 'number' ? 'integer' : 'text',
      },
    })
    sourceId?: IdType;
  }

  return Mixed;
};
