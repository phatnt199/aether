import { MixinTarget } from '@loopback/core';
import { Entity, property } from '@loopback/repository';

export const TzMixin = <E extends MixinTarget<Entity>>(
  superClass: E,
  opts?: {
    createdAt: {
      columnName: string;
      dataType: string;
    };
    modifiedAt: {
      columnName: string;
      dataType: string;
    };
  },
) => {
  class Mixed extends superClass {
    @property({
      type: 'date',
      postgresql: {
        columnName: opts?.createdAt?.columnName ?? 'created_at',
        dataType: opts?.createdAt?.dataType ?? 'TIMESTAMPTZ',
        default: 'NOW()',
        nullable: 'NO',
      },
    })
    createdAt: Date;

    @property({
      type: 'date',
      postgresql: {
        columnName: opts?.modifiedAt?.columnName ?? 'modified_at',
        dataType: opts?.modifiedAt?.dataType ?? 'TIMESTAMPTZ',
        default: 'NOW()',
        nullable: 'NO',
      },
    })
    modifiedAt: Date;
  }

  return Mixed;
};
