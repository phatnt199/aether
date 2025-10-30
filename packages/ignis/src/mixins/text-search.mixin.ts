import { property } from '@/decorators/model.decorators';
import type { ClassType } from '@/common/types';

/**
 * Text search mixin - adds tsvector field for full-text search
 * Matches Loopback 4's TextSearchMixin
 *
 * @param Base - Base class to extend
 * @returns Extended class with text search field
 *
 * @example
 * ```ts
 * export class Article extends TextSearchMixin(BaseTzEntity) {
 *   // Article will have tsvector for PostgreSQL full-text search
 * }
 * ```
 */
export function TextSearchMixin<T extends ClassType<any>>(Base: T) {
  class TextSearchModel extends Base {
    @property({
      type: 'string',
      postgresql: {
        dataType: 'tsvector',
      },
      description: 'Full-text search vector',
    })
    tsvector?: string;
  }

  return TextSearchModel;
}
