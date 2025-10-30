import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * Soft persistent mixin - adds isPersistent flag
 * Matches Loopback 4's SoftPersistentMixin
 */
export function SoftPersistentMixin<T extends ClassType<any>>(Base: T) {
  class SoftPersistentModel extends Base {
    @property({
      type: 'boolean',
      default: false,
      description: 'Persistent flag to indicate if record should be kept',
    })
    isPersistent?: boolean;
  }

  return SoftPersistentModel;
}
