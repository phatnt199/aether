import {
  EntityRelationType,
  ICrudService,
  IDataProvider,
  IdType,
  RequestMethods,
} from '@/common';
import { Logger } from '@/helpers';
import { Filter, Where } from '@loopback/filter';

export interface ICrudServiceOptions {
  basePath: string;
}

export class BaseCrudService<
  E extends { id: IdType; [extra: string | symbol]: any } = any,
> implements ICrudService<E>
{
  protected logger: Logger;
  protected dataProvider: IDataProvider;
  protected serviceOptions: ICrudServiceOptions;

  constructor(opts: {
    scope: string;
    dataProvider: IDataProvider;
    serviceOptions: ICrudServiceOptions;
  }) {
    this.logger = Logger.getInstance({ scope: opts.scope });
    this.dataProvider = opts.dataProvider;
    this.serviceOptions = opts.serviceOptions;
  }

  find(filter: Filter<E>): Promise<(E & EntityRelationType)[]> {
    return new Promise<Array<E>>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath].join('/'),
          params: {
            method: RequestMethods.GET,
            query: { filter },
          },
        })
        .then(rs => {
          resolve(rs.data);
        })
        .catch(reject);
    });
  }

  findById(id: IdType, filter: Filter<E>): Promise<E & EntityRelationType> {
    return new Promise<E & EntityRelationType>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath, id].join('/'),
          params: {
            method: RequestMethods.GET,
            query: { filter },
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }

  findOne(filter: Filter<E>): Promise<(E & EntityRelationType) | null> {
    return new Promise<E & EntityRelationType>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath, 'find-one'].join('/'),
          params: {
            method: RequestMethods.GET,
            query: { filter },
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }

  count(where: Where<E>): Promise<{ count: number }> {
    return new Promise<{ count: number }>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath, 'count'].join('/'),
          params: {
            method: RequestMethods.GET,
            query: { where },
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }

  create(data: Omit<E, 'id'>): Promise<E> {
    return new Promise<E>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath].join('/'),
          params: {
            method: RequestMethods.POST,
            body: data,
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }

  updateAll(data: Partial<E>, where: Where<E>): Promise<{ count: number }> {
    return new Promise<{ count: number }>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath].join('/'),
          params: {
            method: RequestMethods.PATCH,
            query: { where },
            body: data,
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }

  updateById(id: IdType, data: Partial<E>): Promise<E> {
    return new Promise<E>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath, id].join('/'),
          params: {
            method: RequestMethods.PATCH,
            body: data,
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }

  replaceById(id: IdType, data: E): Promise<E> {
    return new Promise<E>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath, id].join('/'),
          params: {
            method: RequestMethods.PUT,
            body: data,
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }

  deleteById(id: IdType): Promise<{ id: IdType }> {
    return new Promise<E>((resolve, reject) => {
      this.dataProvider
        .send({
          resource: [this.serviceOptions.basePath, id].join('/'),
          params: {
            method: RequestMethods.DELETE,
          },
        })
        .then(rs => {
          resolve(rs?.data);
        })
        .catch(reject);
    });
  }
}
