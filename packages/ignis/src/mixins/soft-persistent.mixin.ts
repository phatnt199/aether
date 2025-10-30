import { BaseEntity } from '@/base';
import type { MixinTarget } from '@/common/types';
import { property } from '@/decorators/model.decorators';

/**
 * Soft persistent mixin - adds isPersistent flag
 */
export function SoftPersistentMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
  class SoftPersistentModel extends Base {
    @property({
      type: 'number',
      default: false,
      description: 'Persistent flag to indicate if record should be kept',
    })
    persistentState?: number; // This number can describe state value more than just deleted or not
  }

  return SoftPersistentModel;
}
