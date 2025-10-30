import { BaseEntity } from '@/base';
import type { MixinTarget } from '@/common/types';
import { property } from '@/decorators/model.decorators';

/**
 * Principal mixin - adds fields for security principals
 */
export function PrincipalMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
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
