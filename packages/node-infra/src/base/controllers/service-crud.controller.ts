import { Getter, inject } from '@loopback/core';
import { Count, CountSchema, Filter, FilterExcludingWhere, Where } from '@loopback/repository';
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
  RequestContext,
  RestBindings,
  SchemaRef,
} from '@loopback/rest';
import { CrudRestControllerOptions } from '@loopback/rest-crud';

import { App } from '@/common';
import { EntityRelationType, IController, ICrudService, IdType } from '@/common/types';
import { IJWTTokenPayload } from '@/components/authenticate/common/types';
import { getIdSchema } from '@/utilities/model.utility';
import { SecurityBindings } from '@loopback/security';
import { BaseEntity, TBaseTzEntity } from '../models';
import { applyLimit } from './common';

// --------------------------------------------------------------------------------------------------------------
export interface IServiceCrudControllerOptions<E extends BaseEntity> {
  entity: typeof BaseEntity & { prototype: E };
  service: { name: string };
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
  options?: {
    doInjectCurrentUser?: boolean;
  };
}

// --------------------------------------------------------------------------------------------------------------
export const defineServiceCrudController = <E extends TBaseTzEntity>(
  opts: IServiceCrudControllerOptions<E>,
) => {
  const {
    entity: entityOptions,
    service: serviceOptions,
    controller: controllerOptions,
    schema: schemaOptions,
    options,
  } = opts;

  const idPathParam: ParameterObject = {
    name: 'id',
    in: 'path',
    schema: getIdSchema(entityOptions),
  };

  class ReadController implements IController {
    requestContext: RequestContext;
    service: ICrudService<E>;
    getCurrentUser?: Getter<IJWTTokenPayload>;

    defaultLimit: number;

    constructor(
      requestContext: RequestContext,
      service: ICrudService<E>,
      getCurrentUser?: Getter<IJWTTokenPayload>,
    ) {
      this.service = service;
      this.getCurrentUser = getCurrentUser;
      this.requestContext = requestContext;
      this.defaultLimit = controllerOptions?.defaultLimit ?? App.DEFAULT_QUERY_LIMIT;
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
    find(@param.filter(entityOptions) filter?: Filter<E>): Promise<Array<E & EntityRelationType>> {
      return new Promise<Array<E & EntityRelationType>>((resolve, reject) => {
        this._getContextUser().then(currentUser => {
          this.service
            .find(applyLimit(filter), {
              currentUser,
              requestContext: this.requestContext,
            })
            .then(resolve)
            .catch(reject);
        });
      });
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
      return new Promise<E & EntityRelationType>((resolve, reject) => {
        this._getContextUser().then(currentUser => {
          this.service
            .findById(id, applyLimit(filter), {
              currentUser,
              requestContext: this.requestContext,
            })
            .then(resolve)
            .catch(reject);
        });
      });
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
      return new Promise<(E & EntityRelationType) | null>((resolve, reject) => {
        this._getContextUser().then(currentUser => {
          this.service
            .findOne(applyLimit(filter), {
              currentUser,
              requestContext: this.requestContext,
            })
            .then(resolve)
            .catch(reject);
        });
      });
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
      return new Promise<Count>((resolve, reject) => {
        this._getContextUser().then(currentUser => {
          this.service
            .count(where ?? {}, {
              currentUser,
              requestContext: this.requestContext,
            })
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  if (controllerOptions.readonly) {
    inject(RestBindings.Http.CONTEXT)(ReadController, undefined, 0);

    if (serviceOptions?.name) {
      inject(`services.${serviceOptions.name}`)(ReadController, undefined, 1);
    }

    if (options?.doInjectCurrentUser) {
      inject.getter(SecurityBindings.USER)(ReadController, undefined, 2);
    }

    return ReadController;
  }

  class CrudController extends ReadController {
    constructor(
      requestContext: RequestContext,
      service: ICrudService<E>,
      getCurrentUser?: Getter<IJWTTokenPayload>,
    ) {
      super(requestContext, service, getCurrentUser);
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
                exclude: ['id', 'createdAt', 'modifiedAt'],
              }),
          },
        },
      })
      data: Omit<E, 'id'>,
    ): Promise<E> {
      return new Promise<E>((resolve, reject) => {
        this._getContextUser()
          .then(currentUser => {
            this.service
              .create(data, {
                currentUser,
                requestContext: this.requestContext,
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
        this._getContextUser()
          .then(currentUser => {
            this.service
              .updateAll(data, where ?? {}, {
                currentUser,
                requestContext: this.requestContext,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
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
        this._getContextUser()
          .then(currentUser => {
            this.service
              .updateWithReturn(id, data, {
                currentUser,
                requestContext: this.requestContext,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      });
    }

    // ----------------------------------------------------------------------------------------------------------
    @put('/{id}', {
      responses: {
        '204': { description: `${entityOptions.name} was replaced` },
      },
    })
    replaceById(
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
        this._getContextUser()
          .then(currentUser => {
            this.service
              .replaceById(id, data, {
                currentUser,
                requestContext: this.requestContext,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
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
      return new Promise<{ id: IdType }>((resolve, reject) => {
        this._getContextUser()
          .then(currentUser => {
            this.service
              .deleteById(id, {
                currentUser,
                requestContext: this.requestContext,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      });
    }
  }

  inject(RestBindings.Http.CONTEXT)(CrudController, undefined, 0);

  if (serviceOptions?.name) {
    inject(`services.${serviceOptions.name}`)(CrudController, undefined, 1);
  }

  if (options?.doInjectCurrentUser) {
    inject.getter(SecurityBindings.USER)(CrudController, undefined, 2);
  }

  return CrudController;
};
