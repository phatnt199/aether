import { BaseEntity } from '@/base';
import type { MixinTarget } from '@/common/types';
import { property } from '@/decorators/model.decorators';

/**
 * Timestamp mixin - adds createdAt, modifiedAt, deletedAt fields
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
export function TzMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
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
