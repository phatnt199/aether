import { IdType } from '@/common/types';
import { MixinTarget } from '@loopback/core';
import { Entity, property } from '@loopback/repository';

export const PrincipalMixin = <E extends MixinTarget<Entity>>(
  superClass: E,
  defaultPrincipalType: string,
  principalIdType: 'number' | 'string',
) => {
  class Mixed extends superClass {
    @property({
      type: 'string',
      default: defaultPrincipalType,
      postgresql: {
        columnName: 'principal_type',
        dataType: 'text',
      },
    })
    principalType?: string;

    @property({
      type: principalIdType,
      postgresql: {
        columnName: 'principal_id',
        dataType: principalIdType === 'number' ? 'integer' : 'text',
      },
    })
    principalId?: IdType;
  }

  return Mixed;
};
