import { BaseEntity } from '@/base';
import type { MixinTarget } from '@/common/types';
import { property } from '@/decorators/model.decorators';

/**
 * Duplicatable mixin - adds fields to track duplicated entities
 * Matches Loopback 4's DuplicatableMixin
 */
export function DuplicatableMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
  class DuplicatableModel extends Base {
    @property({
      type: 'number',
      description: 'ID of the original entity this was duplicated from',
    })
    duplicatedFrom?: number;

    @property({
      type: 'date',
      description: 'Timestamp when this entity was duplicated',
    })
    duplicatedAt?: Date;

    @property({
      type: 'number',
      description: 'User who duplicated this entity',
    })
    duplicatedBy?: number;
  }

  return DuplicatableModel;
}
