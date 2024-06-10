import { IdType } from '@/common/types';
import { MixinTarget } from '@loopback/core';
import { Entity, property } from '@loopback/repository';

export const UserAuditMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  class Mixed extends superClass {
    @property({
      type: 'number',
      postgresql: {
        columnName: 'created_by',
        dataType: 'integer',
      },
      hidden: true,
    })
    createdBy: IdType;

    @property({
      type: 'number',
      postgresql: {
        columnName: 'modified_by',
        dataType: 'integer',
      },
      hidden: true,
    })
    modifiedBy: IdType;
  }

  return Mixed;
};
