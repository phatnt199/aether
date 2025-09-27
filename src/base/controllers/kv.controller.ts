import { App } from '@/common';
import { IController } from '@/common/types';
import { inject } from '@loopback/core';
import { DataObject } from '@loopback/repository';
import { del, get, getModelSchemaRef, param, post, requestBody } from '@loopback/rest';
import { CrudRestControllerOptions } from '@loopback/rest-crud';

import { AbstractKVRepository } from '../repositories';
import { BaseKVEntity } from './../models';

// --------------------------------------------------------------------------------------------------------------
export interface IKVControllerOptions<E extends BaseKVEntity> {
  entity: typeof BaseKVEntity & { prototype: E };
  repository: { name: string };
  controller: CrudRestControllerOptions;
}

// --------------------------------------------------------------------------------------------------------------
export const defineKVController = <E extends BaseKVEntity>(opts: IKVControllerOptions<E>) => {
  const {
    entity: entityOptions,
    repository: repositoryOptions,
    controller: controllerOptions,
  } = opts;

  class ReadController implements IController {
    repository: AbstractKVRepository<E>;
    defaultLimit: number = App.DEFAULT_QUERY_LIMIT;

    constructor(repository: AbstractKVRepository<E>) {
      this.repository = repository;
    }

    @get('/{key}', {
      responses: {
        '200': {
          description: `Find ${entityOptions.name} model instance`,
          content: {
            'application/json': {
              schema: getModelSchemaRef(entityOptions),
            },
          },
        },
      },
    })
    get(@param.path.string('key') key: string) {
      return this.repository.get(key);
    }

    @get('/keys', {
      responses: {
        '200': {
          description: 'Get keys by matching pattern',
          content: { 'application/json': {} },
        },
      },
    })
    getKeys(@param.query.string('match') match: string) {
      return this.repository.keys({ match });
    }
  }

  if (controllerOptions.readonly) {
    if (repositoryOptions?.name) {
      inject(`repositories.${repositoryOptions.name}`)(ReadController, undefined, 0);
    }

    return ReadController;
  }

  class KVController extends ReadController {
    constructor(repository: AbstractKVRepository<E>) {
      super(repository);
    }

    @post('/{key}', {
      responses: {
        '200': {
          description: `Create ${entityOptions.name} model instance`,
          content: {
            'application/json': {
              schema: getModelSchemaRef(entityOptions),
            },
          },
        },
      },
    })
    async set(
      @param.path.string('key') key: string,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(entityOptions, {
              title: `New ${entityOptions.name} payload`,
            }),
          },
        },
      })
      data: E,
    ): Promise<E> {
      await this.repository.set(key, data as DataObject<E>);
      return this.repository.get(key);
    }

    @del('/{key}', {
      responses: {
        '204': { description: `${entityOptions} was deleted` },
      },
    })
    deleteById(@param.path.string('key') key: string): Promise<void> {
      return this.repository.delete(key);
    }
  }

  if (repositoryOptions?.name) {
    inject(`repositories.${repositoryOptions.name}`)(KVController, undefined, 0);
  }

  return KVController;
};
