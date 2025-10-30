import { property } from '@/decorators/model.decorators';
import type { MixinTarget } from '@/common/types';
import { BaseEntity } from '@/base';

/**
 * Object search mixin - adds JSONB search field
 */
export function ObjectSearchMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
  class ObjectSearchModel extends Base {
    @property({
      type: 'object',
      postgresql: {
        dataType: 'jsonb',
      },
      description: 'JSONB field for object search',
    })
    searchData?: Record<string, any>;
  }

  return ObjectSearchModel;
}
