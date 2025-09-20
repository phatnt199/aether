import { BaseEntity } from '@/base/base.model';
import { IdType } from '@/common';
import { getError } from '@/utilities';
import { Getter } from '@loopback/core';
import {
  DataObject,
  DefaultHasManyRepository,
  Entity,
  EntityCrudRepository,
  Filter,
  flattenTargetsOfOneToManyRelation,
  HasManyRepositoryFactory,
  InclusionFilter,
  InclusionResolver,
  Options,
  StringKeyOf,
} from '@loopback/repository';
import get from 'lodash/get';
import { IHasManyPolymorphicDefinition, TPolymorphic } from './types';
import { WhereBuilder } from '../../base.repository';

// ----------------------------------------------------------------------------------------------------------------------------------------
const getPolymorphicFields = (opts: {
  discriminator: string | { typeField: string; idField: string };
}) => {
  const { discriminator } = opts;

  let typeField: string | null = null;
  let idField: string | null = null;

  switch (typeof discriminator) {
    case 'string': {
      typeField = `${discriminator}Type`;
      idField = `${discriminator}Id`;
      break;
    }
    case 'object': {
      typeField = discriminator.typeField;
      idField = discriminator.idField;
      break;
    }
    default: {
      throw getError({
        statusCode: 500,
        message: `[getFields] discriminator: ${typeof discriminator} | Invalid discriminator type!`,
      });
    }
  }

  return { typeField, idField };
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/**
 * @experimental
 */
export class DefaultHasManyPolymorphicRepository<
  Target extends BaseEntity,
  TargetId extends IdType,
  TargetRepository extends EntityCrudRepository<Target, TargetId>,
  SourceId,
> extends DefaultHasManyRepository<Target, TargetId, TargetRepository> {
  constructor(opts: {
    targetRepositoryGetter: Getter<TargetRepository>;
    polymorphic: TPolymorphic & { typeValue: string; idValue: SourceId };
  }) {
    const { targetRepositoryGetter, polymorphic } = opts;
    const { typeField, idField } = getPolymorphicFields(polymorphic);

    super(targetRepositoryGetter, {
      [typeField]: polymorphic.typeValue,
      [idField]: polymorphic.idValue,
    } as DataObject<Target>);
  }
}

// ----------------------------------------------------------------------------------------------------------------------------------------
/**
 * @experimental
 */
export const createHasManyPolymorphicInclusionResolver = <
  Target extends BaseEntity,
  TargetId extends IdType,
  TargetRelations extends object,
>(opts: {
  principalType: string;
  relationMetadata: IHasManyPolymorphicDefinition;
  targetRepositoryGetter: Getter<EntityCrudRepository<Target, TargetId, TargetRelations>>;
}): InclusionResolver<Entity, Target> => {
  const { principalType, relationMetadata, targetRepositoryGetter } = opts;

  return async (
    entities: Entity[],
    inclusion: InclusionFilter,
    options?: Options,
  ): Promise<((Target & TargetRelations)[] | undefined)[]> => {
    if (!entities.length) {
      return [];
    }

    const sourceKey = relationMetadata.keyFrom;
    if (!sourceKey) {
      throw getError({
        message: `[createHasManyPolymorphicInclusionResolver] Invalid sourceKey | relationMetadata: ${JSON.stringify(relationMetadata)}`,
      });
    }

    const polymorphicFields = getPolymorphicFields(relationMetadata.polymorphic);
    const sourceIds = entities.map(e => get(e, sourceKey));
    const targetKey = polymorphicFields.idField as StringKeyOf<Target>;

    const scope = typeof inclusion === 'string' ? {} : (inclusion.scope as Filter<Target>);

    const targetRepository = await targetRepositoryGetter();
    const filter: Filter<Target> = {
      ...scope,
      where: new WhereBuilder({
        ...(scope?.where ?? {}),
      })
        .inq(polymorphicFields.idField, sourceIds)
        .eq(polymorphicFields.typeField, principalType)
        .build(),
    };
    const targets = await targetRepository.find(filter, options);
    return flattenTargetsOfOneToManyRelation(sourceIds, targets, targetKey);
  };
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/**
 * @experimental
 */
export const createHasManyPolymorphicRepositoryFactoryFor = <
  Target extends BaseEntity,
  TargetId extends IdType,
  SourceId extends IdType,
>(opts: {
  principalType: string;
  relationMetadata: IHasManyPolymorphicDefinition;
  targetRepositoryGetter: Getter<EntityCrudRepository<Target, TargetId>>;
}): HasManyRepositoryFactory<Target, SourceId> => {
  const { principalType, relationMetadata, targetRepositoryGetter } = opts;

  const rs: HasManyRepositoryFactory<Target, SourceId> = (sourceId: SourceId) => {
    return new DefaultHasManyPolymorphicRepository<
      Target,
      TargetId,
      EntityCrudRepository<Target, TargetId>,
      SourceId
    >({
      targetRepositoryGetter,
      polymorphic: { ...relationMetadata.polymorphic, typeValue: principalType, idValue: sourceId },
    });
  };

  rs.inclusionResolver = createHasManyPolymorphicInclusionResolver(opts);
  return rs;
};
