import { MixinTarget } from '@loopback/core';
import { Entity, property } from '@loopback/repository';

export const TzMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  class Mixed extends superClass {
    @property({
      type: 'date',
      postgresql: {
        columnName: 'created_at',
        dataType: 'TIMESTAMPTZ',
        default: 'NOW()',
        nullable: 'NO',
      },
    })
    createdAt: Date;

    @property({
      type: 'date',
      postgresql: {
        columnName: 'modified_at',
        dataType: 'TIMESTAMPTZ',
        default: 'NOW()',
        nullable: 'NO',
      },
    })
    modifiedAt: Date;
  }

  return Mixed;
};
