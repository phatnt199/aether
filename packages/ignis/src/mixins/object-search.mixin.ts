import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * Object search mixin - adds JSONB search field
 * Matches Loopback 4's ObjectSearchMixin
 */
export function ObjectSearchMixin<T extends ClassType<any>>(Base: T) {
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
