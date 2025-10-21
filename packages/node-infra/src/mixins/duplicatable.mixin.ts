import { BaseEntity, BaseNumberIdEntity } from '@/base/models';
import { IdType } from '@/common';
import { getIdType } from '@/utilities/model.utility';
import { MixinTarget } from '@loopback/core';
import { model, property } from '@loopback/repository';

export const DuplicatableMixin = <E extends MixinTarget<BaseEntity>>(superClass: E) => {
  const sourceIdType = getIdType(BaseNumberIdEntity);

  @model()
  class Mixed extends superClass {
    @property({
      type: sourceIdType,
      postgresql: {
        columnName: 'source_id',
        dataType: sourceIdType === 'number' ? 'integer' : 'text',
      },
    })
    sourceId?: IdType;
  }

  return Mixed;
};
