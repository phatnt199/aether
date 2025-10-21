import { TBaseIdEntity } from '@/base/models';
import { App, EntityRelations, IController, ICrudController } from '@/common';
import {
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import { CrudRepository, Filter } from '@loopback/repository';
import { Response, RestBindings } from '@loopback/rest';
import get from 'lodash/get';

@injectable({ tags: { key: ContentRangeInterceptor.BINDING_KEY } })
export class ContentRangeInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${ContentRangeInterceptor.name}`;

  constructor(
    // @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
  ) {}

  value() {
    return this.intercept.bind(this);
  }

  // -------------------------------------------------------------------------------------
  identifyControllerType(opts: {
    target: IController;
  }): 'single-entity' | 'relation-entity' | undefined {
    const controller = opts.target as ICrudController;

    if (controller?.repository) {
      return 'single-entity';
    }

    if (controller?.sourceRepository && controller?.targetRepository) {
      return 'relation-entity';
    }

    return undefined;
  }

  // -------------------------------------------------------------------------------------
  async handleSingleEntity(opts: { context: InvocationContext; result: Array<TBaseIdEntity> }) {
    const { context } = opts;
    const { args, target } = context;
    const controller = target as ICrudController;

    let filter: Filter<TBaseIdEntity> | null = {};
    filter = args?.[0];
    if (!controller.repository) {
      return;
    }

    const repository = controller.repository as CrudRepository<TBaseIdEntity>;

    if (!filter) {
      filter = {
        skip: 0,
        limit: controller?.defaultLimit ?? App.DEFAULT_QUERY_LIMIT,
        where: {},
      };
    }

    const {
      where = {},
      skip = 0,
      limit = controller?.defaultLimit ?? App.DEFAULT_QUERY_LIMIT,
    } = filter;
    const countRs = await repository.count(where);

    const start = 0 + skip;
    const end = Math.min(start + limit, countRs.count);
    this.response.set(
      'Content-Range',
      `records ${start}-${end > 0 ? end - 1 : end}/${countRs.count}`,
    );
  }

  // -------------------------------------------------------------------------------------
  async handleRelationalEntity(opts: { context: InvocationContext; result: Array<TBaseIdEntity> }) {
    const { context } = opts;
    const { args, target } = context;
    const controller = target as ICrudController;
    const relation = controller.relation;
    if (!relation) {
      return;
    }

    const refId: TBaseIdEntity = args[0];
    let filter: Filter<TBaseIdEntity> = args[1];
    const ref = get(controller.sourceRepository, relation.name)?.(refId);

    if (!controller.sourceRepository || !controller.targetRepository || !refId || !ref) {
      return;
    }

    if (!filter) {
      filter = {
        skip: 0,
        limit: controller?.defaultLimit ?? App.DEFAULT_QUERY_LIMIT,
        where: {},
      };
    }

    const { limit = App.DEFAULT_QUERY_LIMIT, skip = 0, where } = filter;

    switch (relation.type) {
      case EntityRelations.HAS_MANY_THROUGH: {
        const throughConstraint = await ref.getThroughConstraintFromSource();
        const throughRepository = await ref.getThroughRepository();
        const thoughInstances = await throughRepository.find({
          where: { ...throughConstraint },
        });

        const targetConstraint = await ref.getTargetConstraintFromThroughModels(thoughInstances);

        const countRs = await (controller.targetRepository as any).count({
          ...where,
          ...targetConstraint,
        });

        const start = 0 + skip;
        const end = Math.min(start + limit, countRs.count);
        this.response.set(
          'Content-Range',
          `records ${start}-${end > 0 ? end - 1 : end}/${countRs.count}`,
        );

        break;
      }
      case EntityRelations.HAS_MANY: {
        const targetConstraint = ref.constraint;

        const countRs = await (controller.targetRepository as any).count({
          ...where,
          ...targetConstraint,
        });

        const start = 0 + skip;
        const end = Math.min(start + limit, countRs.count);
        this.response.set(
          'Content-Range',
          `records ${start}-${end > 0 ? end - 1 : end}/${countRs.count}`,
        );
        break;
      }
      default: {
        return [];
      }
    }
  }

  // -------------------------------------------------------------------------------------
  async enrichResponseContentRange(opts: {
    context: InvocationContext;
    result: Array<TBaseIdEntity>;
  }) {
    const { context } = opts;
    const { target } = context;

    const controllerType = this.identifyControllerType({ target });
    switch (controllerType) {
      // Normal entity controller
      case 'single-entity': {
        await this.handleSingleEntity(opts);
        break;
      }
      // Relational entity controller
      case 'relation-entity': {
        await this.handleRelationalEntity(opts);
        break;
      }
      default: {
        return;
      }
    }
  }

  async intercept(context: InvocationContext, next: () => ValueOrPromise<InvocationResult>) {
    const result = await next();
    if (this.response.writableEnded) {
      return result;
    }

    this.response.set(
      'Access-Control-Expose-Headers',
      'Content-Length, Content-Type, Content-Range',
    );

    if (!context?.methodName) {
      return result;
    }

    if (this.response.get('Content-Range')) {
      return result;
    }

    const { methodName } = context;
    switch (methodName) {
      case 'find': {
        await this.enrichResponseContentRange({ context, result });
        break;
      }
      default: {
        break;
      }
    }

    return result;
  }
}
