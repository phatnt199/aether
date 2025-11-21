import { BaseEntity } from '@/base/models';
import { AnyObject, IdType } from '@/common';
import { getError } from '@/utilities';
import { Getter } from '@loopback/core';
import {
  DataObject,
  DefaultHasManyThroughRepository,
  Entity,
  EntityCrudRepository,
  Filter,
  HasManyRepositoryFactory,
  InclusionFilter,
  InclusionResolver,
  StringKeyOf,
} from '@loopback/repository';
import get from 'lodash/get';
import uniq from 'lodash/uniq';
import { WhereBuilder } from '../../base.repository';
import { IHasManyThroughPolymorphicDefinition } from './types';

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
        message: `[getPolymorphicFields] discriminator: ${typeof discriminator} | Invalid discriminator type!`,
      });
    }
  }

  return { typeField, idField };
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Repository for HasManyThroughPolymorphic relation
 *
 * This extends DefaultHasManyThroughRepository but adds polymorphic constraints
 * to the through model queries.
 *
 * @experimental
 */
export class DefaultHasManyThroughPolymorphicRepository<
  Target extends BaseEntity,
  TargetId extends IdType,
  Through extends BaseEntity,
  ThroughId extends IdType,
  TargetRepository extends EntityCrudRepository<Target, TargetId>,
  ThroughRepository extends EntityCrudRepository<Through, ThroughId>,
> extends DefaultHasManyThroughRepository<
  Target,
  TargetId,
  TargetRepository,
  Through,
  ThroughId,
  ThroughRepository
> {
  constructor(
    targetRepositoryGetter: Getter<TargetRepository>,
    throughRepositoryGetter: Getter<ThroughRepository>,
    getTargetConstraintFromThroughModels: (throughInstances: Through[]) => DataObject<Target>,
    getTargetKeys: (throughInstances: Through[]) => TargetId[],
    getThroughConstraintFromSource: () => DataObject<Through>,
    getTargetIds: (targetInstances: Target[]) => TargetId[],
    getThroughConstraintFromTarget: (fkValues: TargetId[]) => DataObject<Through>,
    targetResolver: () => typeof Entity,
    throughResolver: () => typeof Entity,
  ) {
    super(
      targetRepositoryGetter,
      throughRepositoryGetter,
      getTargetConstraintFromThroughModels,
      getTargetKeys,
      getThroughConstraintFromSource,
      getTargetIds,
      getThroughConstraintFromTarget,
      targetResolver,
      throughResolver,
    );
  }
}

// ----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates an inclusion resolver for HasManyThroughPolymorphic relation
 *
 * @experimental
 */
export const createHasManyThroughPolymorphicInclusionResolver = <
  Target extends BaseEntity,
  TargetId extends IdType,
  TargetRelations extends object,
  Through extends BaseEntity,
  ThroughId extends IdType,
>(opts: {
  principalType: string;
  relationMetadata: IHasManyThroughPolymorphicDefinition;
  targetRepositoryGetter: Getter<EntityCrudRepository<Target, TargetId, TargetRelations>>;
  throughRepositoryGetter: Getter<EntityCrudRepository<Through, ThroughId>>;
}): InclusionResolver<Entity, Target> => {
  const { principalType, relationMetadata, targetRepositoryGetter, throughRepositoryGetter } = opts;

  return async (
    entities: Entity[],
    inclusion: InclusionFilter,
    options?: AnyObject,
  ): Promise<((Target & TargetRelations)[] | undefined)[]> => {
    if (!entities.length) {
      return [];
    }

    const sourceKey = relationMetadata.keyFrom;
    if (!sourceKey) {
      throw getError({
        message: `[createHasManyThroughPolymorphicInclusionResolver] Invalid sourceKey | relationMetadata: ${JSON.stringify(relationMetadata)}`,
      });
    }

    if (!relationMetadata.through?.model) {
      throw getError({
        message: `[createHasManyThroughPolymorphicInclusionResolver] Missing through model | relationMetadata: ${JSON.stringify(relationMetadata)}`,
      });
    }

    const polymorphicFields = getPolymorphicFields(relationMetadata.polymorphic);
    const sourceIds = entities.map(e => get(e, sourceKey));

    // Resolve through keys
    const throughKeyFrom =
      (relationMetadata.through.keyFrom as StringKeyOf<Through>) ??
      (`${polymorphicFields.idField}` as StringKeyOf<Through>);
    const throughKeyTo =
      (relationMetadata.through.keyTo as StringKeyOf<Through>) ??
      (`${relationMetadata.target().name.toLowerCase()}Id` as StringKeyOf<Through>);

    const scope = typeof inclusion === 'string' ? {} : (inclusion.scope as Filter<Target>);

    // Get through entities with polymorphic constraint
    const throughRepository = await throughRepositoryGetter();
    const throughFilter = {
      where: new WhereBuilder({})
        .inq(throughKeyFrom, sourceIds)
        .eq(polymorphicFields.typeField, principalType)
        .build(),
    };

    const throughEntities = await throughRepository.find(throughFilter, options);

    if (!throughEntities.length) {
      return entities.map(() => []);
    }

    // Extract target IDs from through entities
    const targetIds = uniq(
      throughEntities.map(through => get(through, throughKeyTo as string)).filter(Boolean),
    ) as TargetId[];

    // Get target entities
    const targetRepository = await targetRepositoryGetter();
    const targetKey = (relationMetadata.keyTo ?? 'id') as StringKeyOf<Target>;
    const targetFilter: Filter<Target> = {
      ...scope,
      where: new WhereBuilder({
        ...(scope?.where ?? {}),
      })
        .inq(targetKey, targetIds)
        .build(),
    };
    const targets = await targetRepository.find(targetFilter, options);

    // Build a map: sourceId -> through entities
    const sourceToThroughMap = new Map<unknown, Through[]>();
    throughEntities.forEach(through => {
      const sourceId = get(through, throughKeyFrom as string);
      if (!sourceToThroughMap.has(sourceId)) {
        sourceToThroughMap.set(sourceId, []);
      }
      sourceToThroughMap.get(sourceId)!.push(through);
    });

    // Build a map: targetId -> target entity
    const targetMap = new Map(targets.map(t => [get(t, targetKey as string), t]));

    // Build result: for each source entity, find matching targets through the through entities
    return entities.map(entity => {
      const sourceId = get(entity, sourceKey);
      const throughs = sourceToThroughMap.get(sourceId);

      if (!throughs || throughs.length === 0) {
        return [];
      }

      const result = throughs
        .map(through => {
          const targetId = get(through, throughKeyTo as string);
          return targetMap.get(targetId);
        })
        .filter((t): t is Target & TargetRelations => t !== undefined);

      return result;
    });
  };
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates a repository factory for HasManyThroughPolymorphic relation
 *
 * @experimental
 */
export const createHasManyThroughPolymorphicRepositoryFactoryFor = <
  Target extends BaseEntity,
  TargetId extends IdType,
  Through extends BaseEntity,
  ThroughId extends IdType,
  SourceId extends IdType,
>(opts: {
  principalType: string;
  relationMetadata: IHasManyThroughPolymorphicDefinition;
  targetRepositoryGetter: Getter<EntityCrudRepository<Target, TargetId>>;
  throughRepositoryGetter: Getter<EntityCrudRepository<Through, ThroughId>>;
}): HasManyRepositoryFactory<Target, SourceId> => {
  const { principalType, relationMetadata, targetRepositoryGetter, throughRepositoryGetter } = opts;

  if (!relationMetadata.through) {
    throw getError({
      message: `[createHasManyThroughPolymorphicRepositoryFactoryFor] Missing through in relationMetadata`,
    });
  }

  const polymorphicFields = getPolymorphicFields(relationMetadata.polymorphic);

  const targetModel = relationMetadata.target();

  const throughKeyFrom =
    (relationMetadata.through.keyFrom as StringKeyOf<Through>) ??
    (`${polymorphicFields.idField}` as StringKeyOf<Through>);
  const throughKeyTo =
    (relationMetadata.through.keyTo as StringKeyOf<Through>) ??
    (`${targetModel.name.toLowerCase()}Id` as StringKeyOf<Through>);
  const targetKey = (relationMetadata.keyTo ?? 'id') as StringKeyOf<Target>;

  const rs: HasManyRepositoryFactory<Target, SourceId> = (sourceId: SourceId) => {
    const getTargetConstraintFromThroughModels = (
      throughInstances: Through[],
    ): DataObject<Target> => {
      const targetIds = throughInstances
        .map(through => get(through, throughKeyTo as string))
        .filter(Boolean);

      return {
        [targetKey]: targetIds.length === 1 ? targetIds[0] : { inq: targetIds },
      } as DataObject<Target>;
    };

    const getTargetKeys = (throughInstances: Through[]): TargetId[] => {
      return uniq(
        throughInstances.map(through => get(through, throughKeyTo as string)).filter(Boolean),
      ) as TargetId[];
    };

    const getThroughConstraintFromSource = (): DataObject<Through> => {
      return {
        [throughKeyFrom]: sourceId,
        [polymorphicFields.typeField]: principalType,
      } as DataObject<Through>;
    };

    const getTargetIds = (targetInstances: Target[]): TargetId[] => {
      return uniq(
        targetInstances.map(target => get(target, targetKey as string)).filter(Boolean),
      ) as TargetId[];
    };

    const getThroughConstraintFromTarget = (fkValues: TargetId[]): DataObject<Through> => {
      if (!fkValues || fkValues.length === 0) {
        throw getError({ message: 'fkValues must be provided' });
      }

      return {
        [throughKeyTo]: fkValues.length === 1 ? fkValues[0] : { inq: fkValues },
        [polymorphicFields.typeField]: principalType,
      } as DataObject<Through>;
    };

    return new DefaultHasManyThroughPolymorphicRepository<
      Target,
      TargetId,
      Through,
      ThroughId,
      EntityCrudRepository<Target, TargetId>,
      EntityCrudRepository<Through, ThroughId>
    >(
      targetRepositoryGetter,
      throughRepositoryGetter,
      getTargetConstraintFromThroughModels,
      getTargetKeys,
      getThroughConstraintFromSource,
      getTargetIds,
      getThroughConstraintFromTarget,
      relationMetadata.target,
      relationMetadata.through.model,
    );
  };

  rs.inclusionResolver = createHasManyThroughPolymorphicInclusionResolver(opts);
  return rs;
};
