import {
  AnyObject,
  AnyType,
  EntityClassType,
  EntityRelationType,
  IdType,
  TDBAction,
  TRelationType,
} from '@/common/types';
import { BindingScope, injectable } from '@loopback/core';
import { DataObject, Getter, Inclusion, juggler, Where } from '@loopback/repository';

import {
  BaseObjectSearchTzEntity,
  BaseSearchableTzEntity,
  BaseTextSearchTzEntity,
  TBaseTzEntity,
} from './../models';
import { TzCrudRepository } from './tz-crud.repository';

import { QueueHelper, TQueueElement } from '@/helpers';
import { buildBatchUpdateQuery, executePromiseWithLimit, getTableDefinition } from '@/utilities';
import get from 'lodash/get';
import set from 'lodash/set';

@injectable({ scope: BindingScope.SINGLETON })
export abstract class SearchableTzCrudRepository<
  E extends BaseTextSearchTzEntity | BaseObjectSearchTzEntity | BaseSearchableTzEntity,
  R extends EntityRelationType = EntityRelationType,
> extends TzCrudRepository<E, R> {
  protected readonly searchableInclusions: Inclusion[];
  protected readonly isInclusionRelations: boolean;

  objectSearchQueue: QueueHelper<object>;

  constructor(
    entityClass: EntityClassType<E>,
    dataSource: juggler.DataSource,
    opts: {
      isInclusionRelations: boolean;
      searchableInclusions?: Inclusion[];

      autoDispatchObjectSearchQueue?: boolean;
      onMessage?: (opts: {
        identifier: string;
        queueElement: TQueueElement<object>;
      }) => Promise<void>;
    },
    scope?: string,
  ) {
    super(entityClass, dataSource, scope ?? SearchableTzCrudRepository.name);
    const {
      isInclusionRelations,
      searchableInclusions,
      autoDispatchObjectSearchQueue = true,
      onMessage,
    } = opts;
    this.isInclusionRelations = isInclusionRelations;
    this.searchableInclusions = searchableInclusions ?? [];

    this.objectSearchQueue = new QueueHelper({
      identifier: `${SearchableTzCrudRepository.name}_ObjectSearchQueue`,
      autoDispatch: autoDispatchObjectSearchQueue,
      onMessage: async ({ identifier, queueElement }) => {
        if (onMessage) {
          return onMessage({ identifier, queueElement });
        }
        const { payload } = queueElement;
        const { id, objectSearch } = payload as AnyType;

        await this.updateById(id, { objectSearch } as AnyType, { ignoreMixSearchFields: true });
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  abstract renderTextSearch(opts: { data?: DataObject<E>; entity: E & R }): string;
  abstract renderObjectSearch(opts: { data?: DataObject<E>; entity: E & R }): object;

  abstract onInclusionChanged<RM extends TBaseTzEntity>(opts: {
    relation: string;
    relationRepository: TzCrudRepository<RM>;
    entities: RM[];
    options?: AnyObject;
  }): Promise<void>;

  // ----------------------------------------------------------------------------------------------------
  protected async registerOnInclusionChanged<RM extends TBaseTzEntity>(
    relation: string,
    relationRepositoryGetter: Getter<TzCrudRepository<RM>>,
  ) {
    const relationRepository = await relationRepositoryGetter();
    relationRepository.modelClass.observe('after save', async context => {
      const { isNewInstance, where, instance, options } = context;

      let entities: RM[] = [];

      if (isNewInstance) {
        entities.push(instance);
      } else {
        entities = await relationRepository.find({ where }, options);
      }

      await this.onInclusionChanged({ relation, relationRepository, entities, options });
    });

    relationRepository.modelClass.observe('after deleteWithReturn', async context => {
      const { data } = context;

      await this.onInclusionChanged({
        relation,
        relationRepository,
        entities: data,
      });
    });
  }

  // ----------------------------------------------------------------------------------------------------
  protected async handleInclusionChanged<RM extends TBaseTzEntity>(opts: {
    relationName: string;
    relationType: TRelationType;
    entities: RM[];
    relationRepository: TzCrudRepository<RM>;
    options?: AnyObject;
  }) {
    const { relationName, relationType, entities, relationRepository, options } = opts;

    const resolved = await relationRepository.inclusionResolvers.get(relationName)?.(
      entities,
      {
        relation: relationName,
        scope: {
          include: this.searchableInclusions,
        },
      },
      options,
    );

    switch (relationType) {
      case 'belongsTo': {
        const rs = resolved as (E & R)[];
        if (!rs?.length) {
          break;
        }

        for (const r1 of rs) {
          if (!r1) {
            continue;
          }

          const objectSearch = this.renderObjectSearch({ entity: r1 });
          this.objectSearchQueue.enqueue({ id: r1.id, objectSearch });
        }
        break;
      }
      case 'hasOne': {
        break;
      }
      case 'hasMany':
      case 'hasManyThrough': {
        const rs = resolved as (E & R)[][];
        if (!rs?.length) {
          break;
        }

        for (const r1 of rs) {
          if (!r1?.length) {
            break;
          }

          for (const r2 of r1) {
            if (!rs) {
              continue;
            }

            const objectSearch = this.renderObjectSearch({ entity: r2 });
            this.objectSearchQueue.enqueue({ id: r2.id, objectSearch });
          }
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  // ----------------------------------------------------------------------------------------------------
  private async renderSearchable(
    field: 'textSearch' | 'objectSearch',
    data: DataObject<E>,
    options?: AnyObject & { where?: Where; ignoreMixSearchFields?: boolean },
  ) {
    const where = get(options, 'where');
    const isSearchable = get(this.modelClass.definition.properties, field, null) !== null;
    if (!isSearchable) {
      return null;
    }

    let resolved = [data] as (E & R)[];
    if (this.isInclusionRelations && this.searchableInclusions.length) {
      resolved = await this.includeRelatedModels(
        [data as AnyType],
        this.searchableInclusions,
        options,
      );
    }

    switch (field) {
      case 'textSearch': {
        return this.renderTextSearch({ data, entity: resolved?.[0] });
      }
      case 'objectSearch': {
        let currentObjectSearch = {};
        if (where) {
          const found = await this.findOne({
            where,
            include: this.searchableInclusions,
          });
          if (found) {
            currentObjectSearch = this.renderObjectSearch({
              data,
              entity: found,
            });
          }
        }

        const newObjectSearch = this.renderObjectSearch({
          data,
          entity: resolved?.[0],
        });

        return { ...currentObjectSearch, ...newObjectSearch };
      }
      default: {
        return null;
      }
    }
  }

  // ----------------------------------------------------------------------------------------------------
  mixSearchFields(
    data: DataObject<E>,
    options?: AnyObject & { where?: Where; ignoreMixSearchFields?: boolean },
  ): Promise<DataObject<E>> {
    return new Promise((resolve, reject) => {
      const ignoreMixSearchFields = get(options, 'ignoreMixSearchFields');

      if (ignoreMixSearchFields) {
        return resolve(data);
      }

      Promise.all([
        this.renderSearchable('textSearch', data, options),
        this.renderSearchable('objectSearch', data, options),
      ])
        .then(([ts, os]) => {
          if (ts) {
            set(data, 'textSearch', ts);
          }

          if (os) {
            set(data, 'objectSearch', os);
          }

          resolve(data);
        })
        .catch(reject);
    });
  }

  // ----------------------------------------------------------------------------------------------------
  override create(
    data: DataObject<E>,
    options?: TDBAction & { ignoreMixSearchFields?: boolean },
  ): Promise<E> {
    const tmp = this.mixUserAudit(data, { newInstance: true, authorId: options?.authorId });

    // TODO: problem when mixSearchField before create => id not exist
    // So, in this.mixSearchFields, it take so long because call so many
    // relations data to be query
    // return new Promise((resolve, reject) => {
    //   this.mixSearchFields(tmp, options)
    //     .then(enriched => {
    //       resolve(super.create(enriched, options));
    //     })
    //     .catch(reject);
    // });
    return new Promise((resolve, reject) => {
      super
        .create(tmp, options)
        .then(created => {
          this.mixSearchFields(created, options)
            .then(enriched => {
              this.logger.info('[DEBUG][create] Enriched Data: %j', enriched);
              const objectSearch = get(enriched, 'objectSearch');
              this.objectSearchQueue.enqueue({
                id: created.id,
                objectSearch,
              });
            })
            .catch(reject);

          resolve(created);
        })
        .catch(reject);
    });
  }

  // ----------------------------------------------------------------------------------------------------
  override createAll(
    data: DataObject<E>[],
    options?: TDBAction & { ignoreMixSearchFields?: boolean },
  ): Promise<E[]> {
    // TODO: problem when mixSearchField before create => id not exist
    // So, in this.mixSearchFields, it take so long because call so many
    // relations data to be query
    // return new Promise((resolve, reject) => {
    //   Promise.all(
    //     data.map(el => {
    //       const tmp = this.mixUserAudit(el, { newInstance: true, authorId: options?.authorId });
    //
    //       return this.mixSearchFields(tmp, options);
    //     }),
    //   )
    //     .then(enriched => {
    //       resolve(super.createAll(enriched, options));
    //     })
    //     .catch(reject);
    // });
    return new Promise((resolve, reject) => {
      const audited = data.map(el =>
        this.mixUserAudit(el, { newInstance: true, authorId: options?.authorId }),
      );

      super
        .createAll(audited, options)
        .then(createdItems => {
          createdItems.forEach(created => {
            this.mixSearchFields(created, options)
              .then(enriched => {
                this.logger.info('[DEBUG][createAll] Enriched Data: %j', enriched);
                const objectSearch = get(enriched, 'objectSearch');
                this.objectSearchQueue.enqueue({
                  id: created.id,
                  objectSearch,
                });
              })
              .catch(reject);
          });

          resolve(createdItems);
        })
        .catch(reject);
    });
  }

  // ----------------------------------------------------------------------------------------------------
  override updateById(
    id: IdType,
    data: DataObject<E>,
    options?: TDBAction & { ignoreMixSearchFields?: boolean },
  ): Promise<void> {
    const tmp = this.mixUserAudit(data, { newInstance: false, authorId: options?.authorId });

    return new Promise((resolve, reject) => {
      this.mixSearchFields(tmp, { ...options, where: { id } })
        .then(enriched => {
          resolve(super.updateById(id, enriched, options));
        })
        .catch(reject);
    });
  }

  // ----------------------------------------------------------------------------------------------------
  override replaceById(
    id: IdType,
    data: DataObject<E>,
    options?: TDBAction & { ignoreMixSearchFields?: boolean },
  ): Promise<void> {
    const tmp = this.mixUserAudit(data, { newInstance: false, authorId: options?.authorId });

    return new Promise((resolve, reject) => {
      this.mixSearchFields(tmp, options)
        .then(enriched => {
          resolve(super.replaceById(id, enriched, options));
        })
        .catch(reject);
    });
  }

  // ----------------------------------------------------------------------------------------------------
  private _syncSearchFields(entities: (E & R)[], options?: AnyObject & { pagingLimit?: number }) {
    const { table, columns } = getTableDefinition<E>({ model: this.entityClass });

    const data = entities.map(e => {
      return {
        id: e.id,
        objectSearch: this.renderObjectSearch({ data: e, entity: e }),
        textSearch: this.renderTextSearch({ data: e, entity: e }),
      };
    });

    const setKeys: (
      | keyof BaseSearchableTzEntity
      | { sourceKey: keyof BaseSearchableTzEntity; targetKey: keyof BaseSearchableTzEntity }
    )[] = [];
    const keys: (keyof BaseSearchableTzEntity)[] = [];

    if (get(columns, 'objectSearch')) {
      setKeys.push({ sourceKey: 'objectSearch', targetKey: 'objectSearch' });
      keys.push('objectSearch');
    }

    if (get(columns, 'textSearch')) {
      setKeys.push('textSearch');
      keys.push('textSearch');
    }

    const query = buildBatchUpdateQuery<BaseSearchableTzEntity>({
      data,
      keys: ['id', ...keys],
      tableName: table.name,
      setKeys,
      whereKeys: ['id'],
    });

    return this.execute(query, undefined, options);
  }

  // ----------------------------------------------------------------------------------------------------
  async syncSearchFields(
    where?: Where<E>,
    options?: AnyObject & { pagingLimit?: number },
  ): Promise<void> {
    const t = performance.now();

    const pagingLimit = get(options, 'pagingLimit', 50);
    let pagingOffset = 0;

    this.logger.info('[syncSearchFields] Start sync searchable fields');
    const tasks: (() => Promise<void>)[] = [];
    while (true) {
      const entities = await this.find(
        { where, include: this.searchableInclusions, limit: pagingLimit, offset: pagingOffset },
        options,
      );
      this.logger.info('[syncSearchFields] Where: %j | Found: %d', where, entities.length);

      tasks.push(() =>
        this._syncSearchFields(entities, options)
          .then(() => {
            this.logger.info(`[syncSearchFields] Sucess sync %d rows`, entities.length);
          })
          .catch(e => {
            this.logger.error(`[syncSearchFields] Error: %j`, e);
          }),
      );

      pagingOffset += pagingLimit;
      if (entities.length < pagingLimit) {
        break;
      }
    }

    await executePromiseWithLimit({ tasks, limit: 5 });
    this.logger.info(
      '[syncSearchFields] End sync searchable fields | Took: %d (ms)',
      performance.now() - t,
    );

    return;
  }
}
