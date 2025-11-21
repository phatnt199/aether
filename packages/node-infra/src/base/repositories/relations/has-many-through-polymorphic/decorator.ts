import { Entity, relation, RelationType } from '@loopback/repository';
import { ValueOptionalExcept } from '@/common';
import { IHasManyThroughPolymorphicDefinition } from './types';

/**
 * Custom decorator to define a polymorphic `@hasManyThroughPolymorphic` relationship
 *
 * @param definition - Relation metadata including through model and polymorphic configuration
 *
 * @experimental
 */
export function hasManyThroughPolymorphic(
  definition: ValueOptionalExcept<
    IHasManyThroughPolymorphicDefinition,
    'target' | 'through' | 'polymorphic'
  >,
) {
  return (decoratedTarget: Entity, key: string) => {
    const meta: IHasManyThroughPolymorphicDefinition = {
      name: key,
      type: RelationType.hasMany,
      targetsMany: true,
      source: decoratedTarget.constructor as typeof Entity,
      keyFrom: 'id',
      ...definition,
    };

    relation(meta)(decoratedTarget, key);
  };
}
