import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * Duplicatable mixin - adds fields to track duplicated entities
 * Matches Loopback 4's DuplicatableMixin
 */
export function DuplicatableMixin<T extends ClassType<any>>(Base: T) {
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
