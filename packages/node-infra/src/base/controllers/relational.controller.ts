import { ControllerClass, Getter, inject } from '@loopback/core';
import {
  Condition,
  Count,
  CountSchema,
  DataObject,
  DefaultBelongsToRepository,
  DefaultHasManyRepository,
  DefaultHasManyThroughRepository,
  DefaultHasOneRepository,
  EntityCrudRepository,
  Filter,
  Where,
} from '@loopback/repository';
import { del, get, param, patch, post, requestBody, SchemaObject } from '@loopback/rest';
import getProp from 'lodash/get';

import { App, EntityRelations } from '@/common';
import {
  EntityRelationType,
  IController,
  ICrudController,
  IdType,
  NullableType,
  TRelationType,
} from '@/common/types';
import { IJWTTokenPayload } from '@/components/authenticate';
import { getError } from '@/utilities';
import { SecurityBindings } from '@loopback/security';
import { Class } from '@loopback/service-proxy';
import { TBaseTzEntity } from '../models';
import { AbstractTzRepository } from '../repositories';
import { applyLimit, BaseController } from './common';

// --------------------------------------------------------------------------------------------------------------
export interface IRelationCrudControllerOptions {
  association: {
    entities: {
      source: string;
      target: string;
    };

    repositories?: {
      source: string;
      target: string;
    };

    relation: {
      name: string;
      type: TRelationType;
    };
  };
  schema: {
    source?: SchemaObject;
    relation?: SchemaObject;
    target: SchemaObject;
  };
  options?: {
    useControlTarget: boolean;
    doInjectCurrentUser?: boolean;
    defaultLimit?: number;
    endPoint?: string;
  };
}

// --------------------------------------------------------------------------------------------------------------
export const defineRelationViewController = <
  S extends TBaseTzEntity, // Source Entity Type
  T extends TBaseTzEntity, // Target Entity Type
  TE extends TBaseTzEntity = any, // Through Entity Type
>(opts: {
  // ------------------------------------------------
  baseClass?: Class<BaseController>;

  // ------------------------------------------------
  entities: {
    source: string;
    target: string;
  };

  relation: {
    name: string;
    type: TRelationType;
  };

  // ------------------------------------------------
  defaultLimit?: number;
  endPoint?: string;
  schema?: SchemaObject;
}): ControllerClass => {
  const {
    baseClass,
    entities,
    relation,
    defaultLimit = App.DEFAULT_QUERY_LIMIT,
    endPoint = '',
    schema,
  } = opts;

  const restPath = `/{id}/${endPoint ? endPoint : relation.name}`;
  const BaseClass = baseClass ?? BaseController;

  class ViewController extends BaseClass implements ICrudController {
    sourceRepository: AbstractTzRepository<S, EntityRelationType>;
    targetRepository: AbstractTzRepository<T, EntityRelationType>;
    getCurrentUser?: Getter<IJWTTokenPayload>;
    defaultLimit: number;

    constructor(
      sourceRepository: AbstractTzRepository<S, EntityRelationType>,
      targetRepository: AbstractTzRepository<T, EntityRelationType>,
      getCurrentUser?: Getter<IJWTTokenPayload>,
    ) {
      super({ scope: `ViewController.${relation.name}` });
      this.defaultLimit = defaultLimit;

      if (!sourceRepository) {
        throw getError({
          statusCode: 500,
          message: '[defineRelationViewController] Invalid source repository!',
        });
      }
      this.sourceRepository = sourceRepository;

      if (!targetRepository) {
        throw getError({
          statusCode: 500,
          message: '[defineRelationViewController] Invalid target repository!',
        });
      }
      this.targetRepository = targetRepository;

      if (getCurrentUser && typeof getCurrentUser !== 'function') {
        throw getError({
          statusCode: 500,
          message:
            '[defineRelationViewController] Invalid getCurrentUser type | Please check again the 3rd parameter in constructor!',
        });
      }
      this.getCurrentUser = getCurrentUser;
    }

    // -----------------------------------------------------------------------------------------------
    _getBelongsToRepository(sourceId: IdType) {
      const ref = getProp(this.sourceRepository, relation.name)(sourceId);
      return ref as DefaultBelongsToRepository<T, IdType, typeof this.targetRepository>;
    }

    _getHasOneRepository(sourceId: IdType) {
      const ref = getProp(this.sourceRepository, relation.name)(sourceId);
      return ref as DefaultHasOneRepository<T, IdType, typeof this.targetRepository>;
    }

    _getHasManyRepository(sourceId: IdType) {
      const ref = getProp(this.sourceRepository, relation.name)(sourceId);
      return ref as DefaultHasManyRepository<T, IdType, typeof this.targetRepository>;
    }

    _getHasManyThroughRepository(sourceId: IdType) {
      const ref = getProp(this.sourceRepository, relation.name)(sourceId);
      return ref as DefaultHasManyThroughRepository<
        T,
        IdType,
        typeof this.targetRepository,
        TE,
        IdType,
        EntityCrudRepository<TE, IdType>
      >;
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

        if (typeof this.getCurrentUser !== 'function') {
          throw getError({
            statusCode: 500,
            message:
              '[defineRelationViewController][_getContextUser] Invalid getCurrentUser type | Please check again the 3rd parameter in constructor!',
          });
        }

        this.getCurrentUser().then(resolve).catch(reject);
      });
    }

    // -----------------------------------------------------------------------------------------------
    @get(restPath, {
      responses: {
        '200': {
          description: `Array of target model in relation ${relation.name}`,
          content: {
            'application/json': { schema },
          },
        },
      },
    })
    find(
      @param.path.number('id') id: IdType,
      @param.query.object('filter') filter?: Filter<T>,
    ): Promise<T | T[]> {
      switch (relation.type) {
        case EntityRelations.BELONGS_TO: {
          return this._getBelongsToRepository(id).get();
        }
        case EntityRelations.HAS_ONE: {
          return this._getHasOneRepository(id).get(applyLimit(filter));
        }
        case EntityRelations.HAS_MANY: {
          return this._getHasManyRepository(id).find(applyLimit(filter));
        }
        case EntityRelations.HAS_MANY_THROUGH: {
          return this._getHasManyThroughRepository(id).find(applyLimit(filter));
        }
        default: {
          return Promise.resolve([]);
        }
      }
    }

    // -----------------------------------------------------------------------------------------------
    @get(`${restPath}/count`, {
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: CountSchema,
            },
          },
        },
      },
    })
    count(@param.path.number('id') id: IdType, @param.query.object('where') where?: Where<T>) {
      switch (relation.type) {
        case EntityRelations.BELONGS_TO: {
          return new Promise(resolve => {
            this._getBelongsToRepository(id)
              .get()
              .then(rs => {
                if (!rs) {
                  resolve({ count: 0 });
                  return;
                }
                resolve({ count: 1 });
              })
              .catch(() => {
                resolve({ count: 0 });
              });
          });
        }
        case EntityRelations.HAS_ONE: {
          return new Promise(resolve => {
            this._getHasOneRepository(id)
              .get()
              .then(rs => {
                if (!rs) {
                  resolve({ count: 0 });
                  return;
                }
                resolve({ count: 1 });
              })
              .catch(() => {
                resolve({ count: 0 });
              });
          });
        }
        case EntityRelations.HAS_MANY: {
          const relationRepository = this._getHasManyRepository(id);
          const targetConstraint = relationRepository.constraint;

          const isPrincipalEntity =
            this.targetRepository.modelClass.definition.properties['principalType'] !== null;
          const countCondition = {
            ...where,
            ...targetConstraint,
            principalType: isPrincipalEntity ? entities.source : undefined,
          } as Condition<T>;

          return this.targetRepository.count(countCondition);
        }
        case EntityRelations.HAS_MANY_THROUGH: {
          return new Promise((resolve, reject) => {
            const relationRepository = this._getHasManyThroughRepository(id);

            const throughConstraint =
              relationRepository.getThroughConstraintFromSource() as Condition<TE>;

            relationRepository
              .getThroughRepository()
              .then(throughRepository => {
                throughRepository
                  .find({
                    where: { ...throughConstraint },
                  })
                  .then(throughInstances => {
                    const targetConstraint =
                      relationRepository.getTargetConstraintFromThroughModels(throughInstances);
                    const condition = {
                      ...where,
                      ...targetConstraint,
                    } as Condition<T>;
                    resolve(this.targetRepository.count(condition));
                  })
                  .catch(reject);
              })
              .catch(reject);
          });
        }
        default: {
          return { count: 0 };
        }
      }
    }
  }

  return ViewController;
};

// --------------------------------------------------------------------------------------------------------------
export const defineAssociateController = <
  S extends TBaseTzEntity,
  T extends TBaseTzEntity,
  R extends TBaseTzEntity | NullableType,
>(opts: {
  baseClass: ReturnType<typeof defineRelationViewController>;
  relation: { name: string; type: TRelationType };
  defaultLimit?: number;
  endPoint?: string;
  schema?: SchemaObject;
}): ControllerClass => {
  const {
    baseClass,
    relation,
    defaultLimit = App.DEFAULT_QUERY_LIMIT,
    endPoint = '',
    schema,
  } = opts;
  const restPath = `/{id}/${endPoint ? endPoint : relation.name}`;

  class AssociationController extends baseClass implements IController {
    constructor(
      sourceRepository: AbstractTzRepository<S, EntityRelationType>,
      targetRepository: AbstractTzRepository<T, EntityRelationType>,
      getCurrentUser?: Getter<IJWTTokenPayload>,
    ) {
      super(sourceRepository, targetRepository, getCurrentUser);
      this.defaultLimit = defaultLimit;
    }

    // -----------------------------------------------------------------------------------------------
    @post(`${restPath}/{link_id}`, {
      responses: {
        '200': {
          description: `Create association between source and target for ${relation.name} relation`,
          content: {
            'application/json': {
              schema,
            },
          },
        },
      },
    })
    async link(
      @param.path.number('id') id: number,
      @param.path.number('link_id') linkId: number,
    ): Promise<R | null> {
      const isSourceExist = await this.sourceRepository.exists(id);
      if (!isSourceExist) {
        throw getError({
          statusCode: 400,
          message: 'Invalid association (source model is not existed)',
        });
      }

      const isTargetExist = await this.targetRepository.exists(linkId);
      if (!isTargetExist) {
        throw getError({
          statusCode: 400,
          message: 'Invalid association (target model is not existed)',
        });
      }

      const ref = getProp(this.sourceRepository, relation.name)(id);
      return ref.link(linkId);
    }

    // -----------------------------------------------------------------------------------------------
    @del(`${restPath}/{link_id}`, {
      responses: {
        '200': {
          description: `Remove association between source and target for ${relation.name} relation`,
          content: { 'application/json': {} },
        },
      },
    })
    async unlink(
      @param.path.number('id') id: number,
      @param.path.number('link_id') linkId: number,
    ): Promise<R | null> {
      const ref = getProp(this.sourceRepository, relation.name)(id);
      return ref.unlink(linkId);
    }
  }

  return AssociationController;
};

// --------------------------------------------------------------------------------------------------------------
export const defineRelationCrudController = <
  S extends TBaseTzEntity,
  T extends TBaseTzEntity,
  R extends TBaseTzEntity | NullableType,
>(
  controllerOptions: IRelationCrudControllerOptions,
): ControllerClass => {
  const {
    association,
    schema,
    options = {
      useControlTarget: false,
      defaultLimit: App.DEFAULT_QUERY_LIMIT,
      endPoint: '',
    },
  } = controllerOptions;
  const { entities, repositories, relation } = association;
  const { target } = schema;

  if (!EntityRelations.isValid(relation.type)) {
    throw getError({
      statusCode: 500,
      message: `[defineRelationCrudController] Invalid relationType! Valids: ${[...EntityRelations.SCHEME_SET]}`,
    });
  }

  const { target: targetSchema } = schema;
  const {
    useControlTarget = true,
    defaultLimit = App.DEFAULT_QUERY_LIMIT,
    endPoint = relation.name,
  } = options;
  const restPath = `{id}/${endPoint}`;

  const ViewController = defineRelationViewController<S, T>({
    baseClass: BaseController,
    entities,
    relation,
    defaultLimit,
    endPoint,
    schema: target,
  });
  const AssociationController = defineAssociateController<S, T, R>({
    baseClass: ViewController,
    relation,
    defaultLimit,
    endPoint,
    schema: target,
  });

  // -----------------------------------------------------------------------------------------------

  const ExtendsableClass =
    relation.type === EntityRelations.HAS_MANY_THROUGH ? AssociationController : ViewController;

  if (!useControlTarget) {
    return ExtendsableClass;
  }

  // -----------------------------------------------------------------------------------------------
  class Controller extends ExtendsableClass {
    constructor(
      sourceRepository: AbstractTzRepository<S, any>,
      targetRepository: AbstractTzRepository<T, any>,
      getCurrentUser?: Getter<IJWTTokenPayload>,
    ) {
      super(sourceRepository, targetRepository, getCurrentUser);
    }

    // -----------------------------------------------------------------------------------------------
    @post(restPath, {
      responses: {
        '200': {
          description: `Create target model for ${relation.name} relation`,
          content: {
            'application/json': {
              schema,
            },
          },
        },
      },
    })
    create(
      @param.path.number('id') id: number,
      @requestBody({
        required: true,
        content: {
          'application/json': { schema: targetSchema },
        },
      })
      mapping: DataObject<T>,
    ): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        this._getContextUser()
          .then((currentUser?: { userId: IdType }) => {
            const ref = getProp(this.sourceRepository, relation.name)(id);
            ref
              .create(mapping, {
                authorId: currentUser?.userId,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      });
    }

    // -----------------------------------------------------------------------------------------------
    @patch(restPath, {
      responses: {
        '200': {
          description: `Patch target model for ${relation.name} relation`,
          content: { 'application/json': { schema: CountSchema } },
        },
      },
    })
    patch(
      @param.path.number('id') id: number,
      @requestBody({
        required: true,
        content: {
          'application/json': { schema: targetSchema },
        },
      })
      mapping: Partial<T>,
      @param.query.object('where') where?: Where<T>,
    ): Promise<Count> {
      return new Promise<Count>((resolve, reject) => {
        this._getContextUser()
          .then((currentUser?: { userId: IdType }) => {
            const ref = getProp(this.sourceRepository, relation.name)(id);
            ref
              .patch(mapping, where, {
                authorId: currentUser?.userId,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      });
    }

    // -----------------------------------------------------------------------------------------------
    @del(restPath, {
      responses: {
        '200': {
          description: `Delete target model for ${relation.name} relation`,
          content: { 'application/json': { schema: CountSchema } },
        },
      },
    })
    delete(
      @param.path.number('id') id: number,
      @param.query.object('where') where?: Where<T>,
    ): Promise<Count> {
      return new Promise<Count>((resolve, reject) => {
        this._getContextUser()
          .then((currentUser?: { userId: IdType }) => {
            const ref = getProp(this.sourceRepository, relation.name)(id);
            ref
              .delete(where, {
                authorId: currentUser?.userId,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      });
    }
  }

  inject(`repositories.${repositories?.source ?? `${entities.source}Repository`}`)(
    Controller,
    undefined,
    0,
  );
  inject(`repositories.${repositories?.target ?? `${entities.target}Repository`}`)(
    Controller,
    undefined,
    1,
  );

  if (options.doInjectCurrentUser) {
    inject.getter(SecurityBindings.USER, { optional: true })(Controller, undefined, 2);
  }

  return Controller;
};
