import { Getter, inject } from '@loopback/core';
import {
  Count,
  CountSchema,
  DataObject,
  Filter,
  FilterExcludingWhere,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  param,
  ParameterObject,
  patch,
  post,
  put,
  requestBody,
  SchemaRef,
} from '@loopback/rest';
import { CrudRestControllerOptions } from '@loopback/rest-crud';

import { App } from '@/common';
import { EntityRelationType, IController, IdType } from '@/common/types';
import { IJWTTokenPayload } from '@/components/authenticate/common/types';
import { getIdSchema } from '@/utilities/model.utility';
import { SecurityBindings } from '@loopback/security';
import { BaseEntity } from '../models';
import { DefaultCrudRepository } from '../repositories';
import { applyLimit } from './common';

// --------------------------------------------------------------------------------------------------------------
export interface ICrudControllerOptions<E extends BaseEntity> {
  entity: typeof BaseEntity & { prototype: E };
  repository: { name: string };
  controller: CrudRestControllerOptions & { defaultLimit?: number };
  schema?: {
    find?: SchemaRef;
    findOne?: SchemaRef;
    findById?: SchemaRef;
    count?: SchemaRef;
    createRequestBody?: SchemaRef;
    create?: SchemaRef;
    updateAll?: SchemaRef;
    updateByIdRequestBody?: SchemaRef;
    updateById?: SchemaRef;
    replaceById?: SchemaRef;
    deleteById?: SchemaRef;
  };
  doInjectCurrentUser?: boolean;
}

// --------------------------------------------------------------------------------------------------------------
export const defineCrudController = <E extends BaseEntity>(opts: ICrudControllerOptions<E>) => {
  const {
    entity: entityOptions,
    repository: repositoryOptions,
    controller: controllerOptions,
    schema: schemaOptions,
    doInjectCurrentUser,
  } = opts;

  const idPathParam: ParameterObject = {
    name: 'id',
    in: 'path',
    schema: getIdSchema(entityOptions),
  };

  class ReadController implements IController {
    repository: DefaultCrudRepository<E, EntityRelationType>;

    defaultLimit: number;

    constructor(repository: DefaultCrudRepository<E, EntityRelationType>) {
      this.repository = repository;
      this.defaultLimit = controllerOptions?.defaultLimit ?? App.DEFAULT_QUERY_LIMIT;
    }

    // ----------------------------------------------------------------------------------------------------------
    @get('/', {
      responses: {
        '200': {
          description: `Array of ${entityOptions.name} model instances`,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items:
                  schemaOptions?.find ??
                  getModelSchemaRef(entityOptions, { includeRelations: true }),
              },
            },
          },
        },
      },
    })
    find(@param.filter(entityOptions) filter?: Filter<E>): Promise<(E & EntityRelationType)[]> {
      return this.repository.find(applyLimit(filter));
    }

    // ----------------------------------------------------------------------------------------------------------
    @get('/{id}', {
      responses: {
        '200': {
          description: `Find ${entityOptions.name} model instance`,
          content: {
            'application/json': {
              schema:
                schemaOptions?.findById ??
                getModelSchemaRef(entityOptions, { includeRelations: true }),
            },
          },
        },
      },
    })
    findById(
      @param(idPathParam) id: IdType,
      @param.query.object('filter', getFilterSchemaFor(entityOptions, { exclude: 'where' }))
      filter?: FilterExcludingWhere<E>,
    ): Promise<E & EntityRelationType> {
      return this.repository.findById(id, applyLimit(filter));
    }

    // ----------------------------------------------------------------------------------------------------------
    @get('/find-one', {
      responses: {
        '200': {
          description: `Find one ${entityOptions.name} model instance`,
          content: {
            'application/json': {
              schema:
                schemaOptions?.findOne ??
                getModelSchemaRef(entityOptions, { includeRelations: true }),
            },
          },
        },
      },
    })
    findOne(
      @param.query.object('filter', getFilterSchemaFor(entityOptions))
      filter?: Filter<E>,
    ): Promise<(E & EntityRelationType) | null> {
      return this.repository.findOne(filter);
    }

    // ----------------------------------------------------------------------------------------------------------
    @get('/count', {
      responses: {
        '200': {
          description: `Count number of ${entityOptions.name} model instance`,
          content: {
            'application/json': {
              schema: CountSchema,
            },
          },
        },
      },
    })
    count(@param.where(entityOptions) where?: Where<E>): Promise<Count> {
      return this.repository.count(where);
    }
  }

  if (controllerOptions.readonly) {
    if (repositoryOptions?.name) {
      inject(`repositories.${repositoryOptions.name}`)(ReadController, undefined, 0);
    }

    return ReadController;
  }

  class CrudController extends ReadController {
    getCurrentUser?: Getter<IJWTTokenPayload>;

    constructor(
      repository: DefaultCrudRepository<E, EntityRelationType>,
      getCurrentUser?: Getter<IJWTTokenPayload>,
    ) {
      super(repository);
      this.getCurrentUser = getCurrentUser;
    }

    // ----------------------------------------------------------------------------------------------------------
    _getContextUser() {
      return new Promise<{
        userId: IdType;
        roles: Array<{ id: IdType; identifier: string; priority: number }>;
      } | null>((resolve, reject) => {
        if (!this.getCurrentUser) {
          resolve(null);
          return;
        }

        this.getCurrentUser().then(resolve).catch(reject);
      });
    }

    // ----------------------------------------------------------------------------------------------------------
    @post('/', {
      responses: {
        '200': {
          description: `Create ${entityOptions.name} model instance`,
          content: {
            'application/json': {
              schema: schemaOptions?.create ?? getModelSchemaRef(entityOptions),
            },
          },
        },
      },
    })
    create(
      @requestBody({
        content: {
          'application/json': {
            schema:
              schemaOptions?.createRequestBody ??
              getModelSchemaRef(entityOptions, {
                title: `New ${entityOptions.name} payload`,
                // exclude: ['id', 'createdAt', 'modifiedAt'],
              }),
          },
        },
      })
      data: Omit<E, 'id'>,
    ): Promise<E> {
      return new Promise<E>((resolve, reject) => {
        this._getContextUser()
          .then(currentUser => {
            this.repository
              .create(data as DataObject<E>, {
                authorId: currentUser?.userId,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      });
    }

    // ----------------------------------------------------------------------------------------------------------
    @patch('/', {
      responses: {
        '200': {
          description: `Number of updated ${entityOptions.name} models`,
          content: {
            'application/json': {
              schema: CountSchema,
            },
          },
        },
      },
    })
    updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema:
              schemaOptions?.updateAll ??
              getModelSchemaRef(entityOptions, {
                title: `Partial fields of ${entityOptions.name}`,
                partial: true,
              }),
          },
        },
      })
      data: Partial<E>,
      @param.where(entityOptions)
      where?: Where<E>,
    ): Promise<Count> {
      return new Promise<Count>((resolve, reject) => {
        this._getContextUser().then(currentUser => {
          this.repository
            .updateAll(data as DataObject<E>, where, {
              authorId: currentUser?.userId,
            })
            .then(resolve)
            .catch(reject);
        });
      });
    }

    // ----------------------------------------------------------------------------------------------------------
    @patch('/{id}', {
      responses: {
        '200': {
          description: `Updated ${entityOptions.name} models`,
          content: {
            'application/json': {
              schema:
                schemaOptions?.updateById ??
                getModelSchemaRef(entityOptions, {
                  title: `Updated ${entityOptions.name} models`,
                }),
            },
          },
        },
      },
    })
    updateById(
      @param(idPathParam) id: IdType,
      @requestBody({
        content: {
          'application/json': {
            schema:
              schemaOptions?.updateByIdRequestBody ??
              getModelSchemaRef(entityOptions, {
                title: `Partial fields of ${entityOptions.name}`,
                partial: true,
              }),
          },
        },
      })
      data: Partial<E>,
    ): Promise<E> {
      return new Promise<E>((resolve, reject) => {
        this._getContextUser().then(currentUser => {
          this.repository
            .updateWithReturn(id, data as DataObject<E>, {
              authorId: currentUser?.userId,
            })
            .then(resolve)
            .catch(reject);
        });
      });
    }

    // ----------------------------------------------------------------------------------------------------------
    @put('/{id}', {
      responses: {
        '204': { description: `${entityOptions.name} was replaced` },
      },
    })
    async replaceById(
      @param(idPathParam) id: IdType,
      @requestBody({
        content: {
          'application/json': {
            schema:
              schemaOptions?.replaceById ??
              getModelSchemaRef(entityOptions, {
                title: `Fields of ${entityOptions.name}`,
              }),
          },
        },
      })
      data: E,
    ): Promise<E> {
      return new Promise<E>((resolve, reject) => {
        this._getContextUser().then(currentUser => {
          this.repository
            .replaceById(id, data, {
              authorId: currentUser?.userId,
            })
            .then(() => {
              resolve({ ...data, id });
            })
            .catch(reject);
        });
      });
    }

    // ----------------------------------------------------------------------------------------------------------
    @del('/{id}', {
      responses: {
        '200': {
          description: `${entityOptions.name} was deleted`,
          content: {
            'application/json': {
              schema:
                schemaOptions?.deleteById ??
                getModelSchemaRef(entityOptions, {
                  partial: true,
                  title: `Deleted ${entityOptions.name} models`,
                }),
            },
          },
        },
      },
    })
    deleteById(@param(idPathParam) id: IdType): Promise<{ id: IdType }> {
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

  if (repositoryOptions?.name) {
    inject(`repositories.${repositoryOptions.name}`)(CrudController, undefined, 0);
  }

  if (doInjectCurrentUser) {
    inject.getter(SecurityBindings.USER, { optional: true })(CrudController, undefined, 1);
  }

  return CrudController;
};
