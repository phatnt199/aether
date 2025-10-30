import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * Principal mixin - adds fields for security principals
 * Matches Loopback 4's PrincipalMixin
 */
export function PrincipalMixin<T extends ClassType<any>>(Base: T) {
  class PrincipalModel extends Base {
    @property({
      type: 'string',
      required: true,
      description: 'Principal identifier (username, email, etc.)',
    })
    identifier: string;

    @property({
      type: 'string',
      description: 'Principal realm/domain',
    })
    realm?: string;
  }

  return PrincipalModel;
}
