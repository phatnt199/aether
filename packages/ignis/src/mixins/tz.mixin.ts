import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * Timestamp mixin - adds createdAt, modifiedAt, deletedAt fields
 * Matches Loopback 4's TzMixin
 *
 * @param Base - Base class to extend
 * @returns Extended class with timestamp fields
 *
 * @example
 * ```ts
 * export class User extends TzMixin(BaseEntity) {
 *   // User will have createdAt, modifiedAt, deletedAt
 * }
 * ```
 */
export function TzMixin<T extends ClassType<any>>(Base: T) {
  class TzModel extends Base {
    @property({
      type: 'date',
      default: () => new Date(),
      description: 'Creation timestamp',
    })
    createdAt?: Date;

    @property({
      type: 'date',
      default: () => new Date(),
      description: 'Last modification timestamp',
    })
    modifiedAt?: Date;

    @property({
      type: 'date',
      description: 'Soft delete timestamp',
    })
    deletedAt?: Date;
  }

  return TzModel;
}
