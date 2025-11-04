import {
  EntityClassType,
  EntityRelationType,
  IdType,
  ITzRepository,
  TDBAction,
} from '@/common/types';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError } from '@/utilities';
import {
  DefaultCrudRepository as _DefaultCrudRepository,
  AnyObject,
  WhereBuilder as BaseWhereBuilder,
  Command,
  Count,
  DataObject,
  DefaultKeyValueRepository,
  EntityCrudRepository,
  Getter,
  HasManyRepositoryFactory,
  IsolationLevel,
  juggler,
  NamedParameters,
  PositionalParameters,
  Transaction,
  TransactionalEntityRepository,
  Where,
} from '@loopback/repository';
import { BaseEntity, BaseKVEntity, TBaseTzEntity } from './../models';

import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { createHasManyPolymorphicRepositoryFactoryFor } from './relations/has-many-polymorphic/factory';
import { IHasManyPolymorphicDefinition } from './relations/has-many-polymorphic/types';

// ----------------------------------------------------------------------------------------------------------------------------------------
export class WhereBuilder<E extends object = AnyObject> extends BaseWhereBuilder {
  constructor(opts?: Where<E>) {
    super(opts);
  }

  newInstance(opts?: Where<E>) {
    return new WhereBuilder(opts);
  }

  clone(): WhereBuilder {
    return new WhereBuilder(cloneDeep(this.build()));
  }
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export abstract class DefaultCrudRepository<
  E extends BaseEntity,
  ID,
  Relations extends object = {},
> extends _DefaultCrudRepository<E, ID, Relations> {
  /**
   * @experimental
   */
  createHasManyPolymorphicRepositoryFactoryFor<
    Target extends BaseEntity,
    TargetId extends IdType,
    ForeignKeyType extends IdType,
  >(opts: {
    relationName: string;
    principalType: string;
    targetRepositoryGetter: Getter<EntityCrudRepository<Target, TargetId>>;
  }): HasManyRepositoryFactory<Target, ForeignKeyType> {
    const { relationName, principalType, targetRepositoryGetter } = opts;
    const relationMetadata = this.entityClass.definition.relations[
      relationName
    ] as IHasManyPolymorphicDefinition;

    if (!relationMetadata.polymorphic) {
      throw getError({
        message:
          '[createHasManyPolymorphicRepositoryFactoryFor] polymorphic missing in relation definition!',
      });
    }

    return createHasManyPolymorphicRepositoryFactoryFor<Target, TargetId, ForeignKeyType>({
      relationMetadata,
      principalType,
      targetRepositoryGetter,
    });
  }

  abstract existsWith(where?: Where<E>, options?: TDBAction): Promise<boolean>;
  abstract createWithReturn(data: DataObject<E>, options?: TDBAction): Promise<E>;
  abstract updateWithReturn(id: IdType, data: DataObject<E>, options?: TDBAction): Promise<E>;
  abstract upsertWith(data: DataObject<E>, where: Where<E>, options?: TDBAction): Promise<E | null>;
  abstract deleteWithReturn(
    where: Where<E>,
    options?: TDBAction,
  ): Promise<{ count: Count; data: E[] }>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export abstract class AbstractTzRepository<
    E extends TBaseTzEntity,
    R extends EntityRelationType = EntityRelationType,
  >
  extends DefaultCrudRepository<E, IdType, R>
  implements ITzRepository<E>, TransactionalEntityRepository<E, IdType, R>
{
  protected logger: ApplicationLogger;

  constructor(entityClass: EntityClassType<E>, dataSource: juggler.DataSource, scope?: string) {
    super(entityClass, dataSource);
    this.logger = LoggerFactory.getLogger([scope ?? '']);
  }

  beginTransaction(options?: IsolationLevel | AnyObject): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      this.dataSource
        .beginTransaction(options ?? {})
        .then(rs => {
          resolve(rs as Transaction);
        })
        .catch(reject);
    });
  }

  executeSql<T>(
    command: Command,
    parameters: NamedParameters | PositionalParameters,
    options?: TDBAction,
  ): Promise<T> {
    return this.execute(command, parameters, options) as Promise<T>;
  }

  protected getObservers(opts: { operation: string }): Array<Function> {
    const { operation } = opts;
    return get(this.modelClass, `_observers.${operation}`, []);
  }

  protected notifyObservers(opts: {
    operation: string;
    [extra: symbol | string]: unknown | string;
  }) {
    const { operation, ...rest } = opts;
    const observers = this.getObservers({ operation });
    observers.forEach(observer => observer({ ...this.modelClass, ...rest }));
  }

  abstract mixTimestamp(
    entity: DataObject<E>,
    options?: { newInstance: boolean; ignoreModified?: boolean },
  ): DataObject<E>;
  abstract mixUserAudit(
    entity: DataObject<E>,
    options?: { newInstance: boolean; authorId: IdType },
  ): DataObject<E>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export abstract class AbstractKVRepository<
  E extends BaseKVEntity,
> extends DefaultKeyValueRepository<E> {
  constructor(entityClass: EntityClassType<E>, dataSource: juggler.DataSource) {
    super(entityClass, dataSource);
  }
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export abstract class KVRepository<E extends BaseKVEntity> extends AbstractKVRepository<E> {
  constructor(entityClass: EntityClassType<E>, dataSource: juggler.DataSource) {
    super(entityClass, dataSource);
  }
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export abstract class ViewRepository<
  E extends BaseEntity,
  R extends EntityRelationType = EntityRelationType,
> extends DefaultCrudRepository<E, IdType, R> {
  constructor(entityClass: EntityClassType<E>, dataSource: juggler.DataSource) {
    super(entityClass, dataSource);
  }

  existsWith(where?: Where<E>, options?: TDBAction): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.findOne({ where }, options)
        .then(rs => {
          resolve(rs !== null && rs !== undefined);
        })
        .catch(reject);
    });
  }

  override create(_data: DataObject<E>, _options?: TDBAction): Promise<E> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override createAll(_datum: DataObject<E>[], _options?: TDBAction): Promise<E[]> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override save(_entity: E, _options?: TDBAction): Promise<E> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override update(_entity: E, _options?: TDBAction): Promise<void> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override delete(_entity: E, _options?: TDBAction): Promise<void> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override updateAll(
    _data: DataObject<E>,
    _where?: Where<E>,
    _options?: TDBAction,
  ): Promise<Count> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override updateById(_id: IdType, _data: DataObject<E>, _options?: TDBAction): Promise<void> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override replaceById(_id: IdType, _data: DataObject<E>, _options?: TDBAction): Promise<void> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override deleteAll(_where?: Where<E>, _options?: TDBAction): Promise<Count> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override deleteById(_id: IdType, _options?: TDBAction): Promise<void> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override createWithReturn(_data: DataObject<E>, _options?: TDBAction): Promise<E> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override updateWithReturn(_id: IdType, _data: DataObject<E>, _options?: TDBAction): Promise<E> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override upsertWith(
    _data: DataObject<E>,
    _where: Where<E>,
    _options?: TDBAction,
  ): Promise<E | null> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }

  override deleteWithReturn(
    _where: Where<E>,
    _options?: TDBAction,
  ): Promise<{ count: Count; data: E[] }> {
    throw getError({
      statusCode: 500,
      message: 'Cannot manipulate entity with view repository!',
    });
  }
}
