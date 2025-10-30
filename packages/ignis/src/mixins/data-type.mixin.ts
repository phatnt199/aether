import { property } from '@/decorators/model.decorators';
import type { MixinTarget } from '@/common/types';
import { BaseEntity } from '@/base';

/**
 * Data type mixin - adds polymorphic type fields
 */
export function DataTypeMixin<T extends MixinTarget<BaseEntity>>(Base: T) {
  class DataTypeModel extends Base {
    @property({
      type: 'string',
      required: true,
      description: 'Entity type discriminator',
    })
    type: string;

    @property({
      type: 'string',
      description: 'Entity category',
    })
    category?: string;

    @property({
      type: 'string',
      description: 'Entity scheme',
    })
    scheme?: string;

    @property({
      type: 'array',
      itemType: 'string',
      description: 'Entity tags',
    })
    tags?: string[];

    @property({
      type: 'object',
      description: 'Additional metadata',
    })
    metadata?: Record<string, any>;
  }

  return DataTypeModel;
}
