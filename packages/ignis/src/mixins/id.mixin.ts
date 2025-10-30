import { BaseEntity } from '@/base';
import type { MixinTarget } from '@/common/types';
import { property } from '@/decorators/model.decorators';

/**
 * ID mixin for numeric ID
 */
export function IdMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
  class IdModel extends Base {
    @property({
      type: 'number',
      id: true,
      generated: true,
      description: 'Unique identifier',
    })
    id: number;
  }

  return IdModel;
}

/**
 * String ID mixin
 */
export function StringIdMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
  class StringIdModel extends Base {
    @property({
      type: 'string',
      id: true,
      description: 'Unique string identifier',
    })
    id: string;
  }

  return StringIdModel;
}
