import { Entity, relation, RelationType } from '@loopback/repository';
import { IHasManyPolymorphicDefinition } from './types';
import { ValueOptionalExcept } from '@/common';

/**
 * Custom decorator to define a polymorphic `@hasManyPolymorphic` relationship
 *
 * @param targetModelGetter - A function to return the target model constructor
 * @param definition - Additional relation metadata
 *
 * @experimental
 */
export function hasManyPolymorphic(
  definition: ValueOptionalExcept<IHasManyPolymorphicDefinition, 'target'>,
) {
  return (decoratedTarget: Entity, key: string) => {
    const meta: IHasManyPolymorphicDefinition = {
      name: key,
      type: RelationType.hasMany,
      targetsMany: true,
      source: decoratedTarget.constructor as typeof Entity,
      keyFrom: 'id',
      keyTo: 'principalId',
      polymorphic: {
        discriminator: 'principal',
      },
      ...definition,
    };

    relation(meta)(decoratedTarget, key);
  };
}
