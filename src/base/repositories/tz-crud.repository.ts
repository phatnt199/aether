import { AnyType, EntityClassType, EntityRelationType, IdType } from '@/common/types';
import { QueryBuilderHelper } from '@/helpers';
import { getError } from '@/utilities';
import { Count, DataObject, juggler, Options, Where } from '@loopback/repository';

import { BaseTzEntity, BaseUserAuditTzEntity } from '../base.model';
import { AbstractTzRepository } from './base.repository';

import get from 'lodash/get';

// ----------------------------------------------------------------------------------------------------------------------------------------
export abstract class TzCrudRepository<
  E extends BaseTzEntity,
  R extends EntityRelationType = AnyType,
> extends AbstractTzRepository<E, R> {
  constructor(entityClass: EntityClassType<E>, dataSource: juggler.DataSource, scope?: string) {
    super(entityClass, dataSource, scope);
  }

  existsWith(where?: Where<E>, options?: Options): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.findOne({ where }, options)
        .then(rs => {
          resolve(rs !== null && rs !== undefined);
        })
        .catch(reject);
    });
  }

  create(data: DataObject<E>, options?: Options & { authorId?: IdType; ignoreModified?: boolean }): Promise<E> {
    let enriched = this.mixTimestamp(data, {
      newInstance: true,
      ignoreModified: options?.ignoreModified ?? false,
    });
    enriched = this.mixUserAudit(enriched, {
      newInstance: true,
      authorId: options?.authorId,
    });

    return super.create(enriched, options);
  }

  createAll(datum: DataObject<E>[], options?: Options & { authorId?: IdType; ignoreModified?: boolean }): Promise<E[]> {
    const enriched = datum.map(data => {
      const tmp = this.mixTimestamp(data, {
        newInstance: true,
        ignoreModified: options?.ignoreModified ?? false,
      });
      return this.mixUserAudit(tmp, {
        newInstance: true,
        authorId: options?.authorId,
      });
    });

    return super.createAll(enriched, options);
  }

  /*
   * @deprecated | Redundant | Please .create
   */
  createWithReturn(
    data: DataObject<E>,
    options?: Options & { authorId?: IdType; ignoreModified?: boolean },
  ): Promise<E> {
    return this.create(data, options);
  }

  updateById(
    id: IdType,
    data: DataObject<E>,
    options?: Options & { authorId?: IdType; ignoreModified?: boolean },
  ): Promise<void> {
    let enriched = this.mixTimestamp(data, {
      newInstance: false,
      ignoreModified: options?.ignoreModified ?? false,
    });
    enriched = this.mixUserAudit(enriched, {
      newInstance: false,
      authorId: options?.authorId,
    });

    return super.updateById(id, enriched, options);
  }

  updateWithReturn(
    id: IdType,
    data: DataObject<E>,
    options?: Options & { authorId?: IdType; ignoreModified?: boolean },
  ): Promise<E> {
    return new Promise((resolve, reject) => {
      this.updateById(id, data, options)
        .then(() => {
          this.findById(id, undefined, options)
            .then(rs => {
              resolve(rs);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  updateAll(
    data: DataObject<E>,
    where?: Where<E>,
    options?: Options & { authorId?: IdType; ignoreModified?: boolean },
  ): Promise<Count> {
    let enriched = this.mixTimestamp(data, {
      newInstance: false,
      ignoreModified: options?.ignoreModified ?? false,
    });
    enriched = this.mixUserAudit(enriched, {
      newInstance: false,
      authorId: options?.authorId,
    });

    return super.updateAll(enriched, where, options);
  }

  async upsertWith(
    data: DataObject<E>,
    where: Where<E>,
    options?: Options & { authorId?: IdType; ignoreModified?: boolean },
  ): Promise<E | null> {
    const isExisted = await this.existsWith(where, options);
    if (isExisted) {
      await this.updateAll(data, where, options);
      const rs = await this.findOne({ where }, options);
      return rs;
    }

    const rs = await this.create(data, options);
    return rs;
  }

  replaceById(
    id: IdType,
    data: DataObject<E>,
    options?: Options & { authorId?: IdType; ignoreModified?: boolean },
  ): Promise<void> {
    let enriched = this.mixTimestamp(data, {
      newInstance: false,
      ignoreModified: options?.ignoreModified ?? false,
    });
    enriched = this.mixUserAudit(enriched, {
      newInstance: false,
      authorId: options?.authorId,
    });

    return super.replaceById(id, enriched, options);
  }

  private _softDelete(
    where: Where<E>,
    options?: Options & {
      databaseSchema?: string;
      connectorType?: string;
      softDeleteField?: string;
      authorId?: IdType;
      useIgnoreModified?: boolean;
    },
  ): Promise<Count> {
    return new Promise<Count>((resolve, reject) => {
      const {
        databaseSchema,
        connectorType = 'postgresql',
        softDeleteField = 'isDeleted',
        useIgnoreModified = false,
        authorId,
      } = options ?? {};

      const tableName = this.modelClass.definition.tableName(connectorType);
      const softDeleteColumnName = this.modelClass.definition.columnName(connectorType, softDeleteField);

      // Mix Timestamp
      const mixTimestampColumnName = this.modelClass.definition.columnName(connectorType, 'modifiedAt');
      const schema = get(this.modelClass.definition.settings, `${connectorType}.schema`, 'public');

      // Mix User Audit
      const mixUserAuditColumnName = this.modelClass.definition.columnName(connectorType, 'modifiedBy');

      const isSoftDeleteFieldExist = get(this.modelClass.definition.rawProperties, softDeleteField);
      if (!isSoftDeleteFieldExist) {
        throw getError({
          message: `[softDelete] Model: ${this.modelClass.name} | Soft delete is not supported!`,
        });
      }

      const now = new Date();
      this.find({ fields: { id: true }, where })
        .then(rs => {
          const sqlBuilder = QueryBuilderHelper.getPostgresQueryBuilder()
            .withSchema(databaseSchema ?? schema ?? 'public')
            .from(tableName)
            .update({ [softDeleteColumnName]: true })
            .whereIn(
              'id',
              rs.map(el => el.id),
            );

          if (mixTimestampColumnName && !useIgnoreModified) {
            sqlBuilder.update(mixTimestampColumnName, now);
          }

          if (mixUserAuditColumnName && authorId) {
            sqlBuilder.update(mixUserAuditColumnName, authorId);
          }

          this.execute(sqlBuilder.toQuery(), null, options)
            .then(res => {
              resolve({ count: res.count });
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  softDelete(
    where: Where<E>,
    options?: Options & {
      databaseSchema?: string;
      connectorType?: string;
      softDeleteField?: string;
      authorId?: IdType;
      ignoreModified?: boolean;
    },
  ): Promise<Count> {
    return new Promise<Count>((resolve, reject) => {
      this._softDelete(where, options)
        .then(rs => {
          resolve(rs);
          this.notifyObservers({
            operation: 'after softDelete',
            where,
            options,
            data: rs,
          });
        })
        .catch(error => {
          reject(error);
          this.notifyObservers({
            operation: 'after softDelete error',
            where,
            options,
            data: null,
          });
        });
    });
  }

  mixTimestamp(
    entity: DataObject<E>,
    options: Options & { newInstance?: boolean; ignoreModified?: boolean } = {
      newInstance: false,
      ignoreModified: false,
    },
  ): DataObject<E> {
    if (options?.newInstance) {
      entity.createdAt = new Date();
    }

    if (!options.ignoreModified) {
      entity.modifiedAt = new Date();
    }

    return entity;
  }

  mixUserAudit(
    entity: DataObject<E>,
    options?: { newInstance: boolean; authorId?: IdType } | undefined,
  ): DataObject<E> {
    if (!options?.authorId) {
      return entity;
    }

    if (options?.newInstance) {
      (entity as BaseUserAuditTzEntity).createdBy = options.authorId;
    }

    (entity as BaseUserAuditTzEntity).modifiedBy = options.authorId;
    return entity;
  }

  _deleteWithReturn(where: Where<E>, options?: Options): Promise<{ count: Count; data: (E & R)[] }> {
    return new Promise((resolve, reject) => {
      this.find({ where })
        .then(found => {
          this.deleteAll(where, options)
            .then(count => resolve({ count, data: found }))
            .catch(reject);
        })
        .catch(reject);
    });
  }

  deleteWithReturn(where: Where<E>, options?: Options): Promise<{ count: Count; data: (E & R)[] }> {
    return new Promise((resolve, reject) => {
      this._deleteWithReturn(where, options)
        .then(rs => {
          resolve(rs);
          this.notifyObservers({
            operation: 'after deleteWithReturn',
            where,
            options,
            data: rs,
          });
        })
        .catch(e => {
          reject(e);
          this.notifyObservers({
            operation: 'after deleteWithReturn error',
            where,
            options,
            data: null,
          });
        });
    });
  }
}
