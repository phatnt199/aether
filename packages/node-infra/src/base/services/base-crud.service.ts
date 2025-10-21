import { EntityRelationType, ICrudMethodOptions, ICrudService, IdType } from '@/common';
import { Count, DataObject, Filter, Where } from '@loopback/repository';
import { applyLimit } from '../controllers/common';
import { TBaseTzEntity } from '../models';
import { AbstractTzRepository } from '../repositories';
import { BaseService } from './base.service';

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

  find(filter: Filter<E>, _options: ICrudMethodOptions): Promise<(E & EntityRelationType)[]> {
    return this.repository.find(applyLimit(filter));
  }

  findById(
    id: IdType,
    filter: Filter<E>,
    _options: ICrudMethodOptions,
  ): Promise<E & EntityRelationType> {
    return this.repository.findById(id, applyLimit(filter));
  }

  findOne(
    filter: Filter<E>,
    _options: ICrudMethodOptions,
  ): Promise<(E & EntityRelationType) | null> {
    return this.repository.findOne(filter);
  }

  count(where: Where<E>, _options: ICrudMethodOptions): Promise<Count> {
    return this.repository.count(where);
  }

  create(data: Omit<E, 'id'>, options: ICrudMethodOptions): Promise<E> {
    return this.repository.create(data as DataObject<E>, {
      authorId: options.currentUser?.userId,
    });
  }

  updateAll(data: Partial<E>, where: Where<E>, options: ICrudMethodOptions): Promise<Count> {
    return this.repository.updateAll(data as DataObject<E>, where, {
      authorId: options.currentUser?.userId,
    });
  }

  updateWithReturn(id: IdType, data: Partial<E>, options: ICrudMethodOptions): Promise<E> {
    return this.repository.updateWithReturn(id, data as DataObject<E>, {
      authorId: options.currentUser?.userId,
    });
  }

  replaceById(id: IdType, data: E, options: ICrudMethodOptions): Promise<E> {
    return new Promise<E>((resolve, reject) => {
      this.repository
        .replaceById(id, data, {
          authorId: options.currentUser?.userId,
        })
        .then(() => {
          resolve({ ...data, id });
        })
        .catch(reject);
    });
  }

  deleteById(id: IdType, _options: ICrudMethodOptions): Promise<{ id: IdType }> {
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
