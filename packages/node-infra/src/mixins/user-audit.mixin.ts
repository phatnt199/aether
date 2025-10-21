import { TBaseTzEntity } from '@/base/models';
import { IdType } from '@/common/types';
import { getError } from '@/utilities';
import { MixinTarget } from '@loopback/core';
import { belongsTo, Entity, EntityResolver, model, property } from '@loopback/repository';

export const UserAuditMixin = <
  E extends MixinTarget<Entity>,
  C extends TBaseTzEntity = TBaseTzEntity,
  M extends TBaseTzEntity = TBaseTzEntity,
>(
  superClass: E,
  opts?: {
    useRelation: boolean;
    creatorResolver: EntityResolver<C>;
    creatorKeyTo?: string;
    modifierResolver: EntityResolver<M>;
    modifierKeyTo?: string;
  },
) => {
  const {
    useRelation = false,
    creatorResolver,
    creatorKeyTo,
    modifierResolver,
    modifierKeyTo,
  } = opts ?? {};

  if (!useRelation) {
    @model()
    class Mixed extends superClass {
      @property({
        type: 'number',
        postgresql: {
          columnName: 'created_by',
          dataType: 'integer',
        },
        // hidden: true,
      })
      createdBy: IdType;

      @property({
        type: 'number',
        postgresql: {
          columnName: 'modified_by',
          dataType: 'integer',
        },
        // hidden: true,
      })
      modifiedBy: IdType;
    }

    return Mixed;
  }

  if (useRelation && !creatorResolver) {
    throw getError({ message: '[UserAuditMixin] Invalid creatorResolver' });
  }

  if (useRelation && !modifierResolver) {
    throw getError({ message: '[UserAuditMixin] Invalid modifierResolver' });
  }

  @model()
  class Mixed extends superClass {
    @belongsTo(
      creatorResolver!,
      { keyFrom: 'createdBy', keyTo: creatorKeyTo, name: 'creator' },
      {
        type: 'number',
        postgresql: {
          columnName: 'created_by',
          dataType: 'integer',
        },
      },
    )
    createdBy: IdType;

    @belongsTo(
      creatorResolver!,
      { keyFrom: 'modifiedBy', keyTo: modifierKeyTo, name: 'modifier' },
      {
        type: 'number',
        postgresql: {
          columnName: 'modified_by',
          dataType: 'integer',
        },
      },
    )
    modifiedBy: IdType;
  }

  return Mixed;
};
