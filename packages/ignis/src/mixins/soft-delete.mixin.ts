import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * Soft delete mixin - adds isDeleted flag
 * Matches Loopback 4's SoftDeleteModelMixin
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
export function SoftDeleteModelMixin<T extends ClassType<any>>(Base: T) {
  class SoftDeleteModel extends Base {
    @property({
      type: 'boolean',
      default: false,
      description: 'Soft delete flag',
    })
    isDeleted?: boolean;
  }

  return SoftDeleteModel;
}
