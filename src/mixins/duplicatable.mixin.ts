import { BaseIdEntity } from '@/base/models/base.model';
import { IdType } from '@/common';
import { getIdType } from '@/utilities/model.utility';
import { MixinTarget } from '@loopback/core';
import { model, property } from '@loopback/repository';

export const DuplicatableMixin = <E extends MixinTarget<BaseIdEntity>>(superClass: E) => {
  const sourceIdType = getIdType(BaseIdEntity);

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
