import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * ID mixin for numeric ID
 */
export function IdMixin<T extends ClassType<any>>(Base: T) {
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
export function StringIdMixin<T extends ClassType<any>>(Base: T) {
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
