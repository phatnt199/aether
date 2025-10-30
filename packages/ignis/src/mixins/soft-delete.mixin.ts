import { BaseEntity } from '@/base';
import type { MixinTarget } from '@/common/types';
import { property } from '@/decorators/model.decorators';

/**
 * Soft delete mixin - adds isDeleted flag
 *
 * @param Base - Base class to extend
 * @returns Extended class with soft delete field
 *
 * @example
 * ```ts
 * export class User extends SoftDeleteModelMixin(BaseTzEntity) {
 *   // User will have isDeleted boolean
 * }
 * ```
 */
export function SoftDeleteModelMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
  class SoftDeleteModel extends Base {
    @property({
      type: 'boolean',
      default: () => false,
      description: 'Soft delete flag',
    })
    isDeleted?: boolean;

    @property({ type: 'date' })
    deletedAt?: Date;
  }

  return SoftDeleteModel;
}
