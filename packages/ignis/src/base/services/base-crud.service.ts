import type {
  ICrudService,
  ICrudMethodOptions,
  IdType,
  Filter,
  Where,
  Count,
  DataObject,
  EntityRelationType,
} from '@/common/types';
import type { TBaseTzEntity } from '@/base/models';
import type { AbstractTzRepository } from '@/base/repositories';
import { BaseService } from './base.service';
import { App } from '@/common/constants';

/**
 * Apply default limit to filter
 */
export function applyLimit<T>(filter?: Filter<T>, defaultLimit?: number): Filter<T> {
  return {
    ...filter,
    limit: filter?.limit || defaultLimit || App.DEFAULT_QUERY_LIMIT,
  };
}

/**
 * Base CRUD service
 * Provides service layer abstraction over repositories
 * Matches Loopback 4's BaseCrudService
 */
export abstract class BaseCrudService<E extends TBaseTzEntity>
  extends BaseService
  implements ICrudService<E>
{
  repository: AbstractTzRepository<E, EntityRelationType>;

  constructor(opts: { scope: string; repository: AbstractTzRepository<E, EntityRelationType> }) {
    const { scope, repository } = opts;
    super({ scope });
    this.repository = repository;
  }

  async find(
    filter: Filter<E>,
    _options: ICrudMethodOptions,
  ): Promise<Array<E & EntityRelationType>> {
    return this.repository.find(applyLimit(filter));
  }

  async findById(
    id: IdType,
    filter: Filter<E>,
    _options: ICrudMethodOptions,
  ): Promise<E & EntityRelationType> {
    return this.repository.findById(id, applyLimit(filter));
  }

  async findOne(
    filter: Filter<E>,
    _options: ICrudMethodOptions,
  ): Promise<(E & EntityRelationType) | null> {
    return this.repository.findOne(filter);
  }

  async count(where: Where<E>, _options: ICrudMethodOptions): Promise<Count> {
    return this.repository.count(where);
  }

  async create(data: Omit<E, 'id'>, options: ICrudMethodOptions): Promise<E> {
    return this.repository.create(data as DataObject<E>, {
      authorId: options.currentUser?.userId,
    });
  }

  async updateAll(data: Partial<E>, where: Where<E>, options: ICrudMethodOptions): Promise<Count> {
    return this.repository.updateAll(data as DataObject<E>, where, {
      authorId: options.currentUser?.userId,
    });
  }

  async updateWithReturn(id: IdType, data: Partial<E>, options: ICrudMethodOptions): Promise<E> {
    return this.repository.updateWithReturn(id, data as DataObject<E>, {
      authorId: options.currentUser?.userId,
    });
  }

  async replaceById(id: IdType, data: E, options: ICrudMethodOptions): Promise<E> {
    return new Promise<E>((resolve, reject) => {
      this.repository
        .replaceById(id, data, {
          authorId: options.currentUser?.userId,
        })
        .then(() => {
          resolve({ ...data, id } as E);
        })
        .catch(reject);
    });
  }

  async deleteById(id: IdType, _options: ICrudMethodOptions): Promise<{ id: IdType }> {
    return new Promise((resolve, reject) => {
      this.repository
        .deleteById(id)
        .then(() => {
          resolve({ id });
        })
        .catch(reject);
    });
  }
}
