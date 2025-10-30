import { property, belongsTo } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * User audit mixin - adds createdBy and modifiedBy fields
 * Matches Loopback 4's UserAuditMixin
 *
 * @param Base - Base class to extend
 * @param options - Mixin options
 * @returns Extended class with user audit fields
 *
 * @example
 * ```ts
 * export class Post extends UserAuditMixin(BaseTzEntity) {
 *   // Post will have createdBy, modifiedBy
 * }
 * ```
 */
export function UserAuditMixin<T extends ClassType<any>>(
  Base: T,
  options?: {
    createdByField?: string;
    modifiedByField?: string;
    userModel?: string | ClassType<any>;
  },
) {
  const createdByField = options?.createdByField || 'createdBy';
  const modifiedByField = options?.modifiedByField || 'modifiedBy';

  class UserAuditModel extends Base {
    @property({
      type: 'number',
      description: 'ID of user who created this record',
    })
    [createdByField]?: number;

    @property({
      type: 'number',
      description: 'ID of user who last modified this record',
    })
    [modifiedByField]?: number;
  }

  return UserAuditModel;
}

/**
 * User audit mixin with relations - includes user relations
 * Matches Loopback 4's UserAuditMixin with relations
 */
export function UserAuditWithRelationsMixin<T extends ClassType<any>>(
  Base: T,
  options: {
    userModel: string | ClassType<any> | (() => ClassType<any>);
    createdByField?: string;
    modifiedByField?: string;
  },
) {
  const createdByField = options.createdByField || 'createdBy';
  const modifiedByField = options.modifiedByField || 'modifiedBy';
  const userModel = options.userModel;

  class UserAuditWithRelationsModel extends Base {
    @belongsTo(() => (typeof userModel === 'function' && userModel.length === 0 ? userModel() : userModel), {
      keyFrom: createdByField,
      keyTo: 'id',
    })
    [createdByField]?: number;

    @belongsTo(() => (typeof userModel === 'function' && userModel.length === 0 ? userModel() : userModel), {
      keyFrom: modifiedByField,
      keyTo: 'id',
    })
    [modifiedByField]?: number;

    // Accessor properties for relations
    createdByUser?: any;
    modifiedByUser?: any;
  }

  return UserAuditWithRelationsModel;
}
