import { property } from '@/decorators/model.decorators';
import type { MixinTarget } from '@/common/types';
import { BaseEntity } from '@/base';

/**
 * Vector mixin - adds embedding fields for vector similarity search
 * Matches Loopback 4's VectorMixin
 *
 * @param Base - Base class to extend
 * @param options - Vector options
 * @returns Extended class with vector fields
 *
 * @example
 * ```ts
 * export class Document extends VectorMixin(BaseTzEntity, { dimension: 1536 }) {
 *   // Document will have embedding, embeddingModel, etc.
 * }
 * ```
 */
export function VectorMixin<T extends MixinTarget<BaseEntity>>(
  Base: T,
  options?: {
    dimension?: number;
    embeddingField?: string;
  },
) {
  const dimension = options?.dimension || 1536;
  const embeddingField = options?.embeddingField || 'embedding';

  class VectorModel extends Base {
    @property({
      type: 'array',
      itemType: 'number',
      postgresql: {
        dataType: `vector(${dimension})`,
      },
      description: 'Vector embedding for similarity search',
    })
    [embeddingField]?: number[];

    @property({
      type: 'string',
      description: 'Embedding model used',
    })
    embeddingModel?: string;

    @property({
      type: 'number',
      description: 'Embedding model dimension',
    })
    embeddingDimension?: number;

    @property({
      type: 'date',
      description: 'Timestamp when embedding was generated',
    })
    embeddingGeneratedAt?: Date;
  }

  return VectorModel;
}
