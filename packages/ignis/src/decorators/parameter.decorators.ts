import { ParameterType } from '@/core/metadata/constants';
import { MetadataRegistry } from '@/core/metadata/registry';
import type { IParameterMetadata } from '@/core/metadata/types';
import type { Context } from 'hono';
import type { AnyObject, ClassType } from '@/common/types';

/**
 * Parameter decorator factory
 */
function createParameterDecorator(
  type: ParameterType,
  name?: string,
  options?: {
    required?: boolean;
    schema?: AnyObject;
    extractor?: (ctx: Context) => any;
  },
) {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const metadata: IParameterMetadata = {
      index: parameterIndex,
      type,
      name,
      required: options?.required,
      schema: options?.schema,
      extractor: options?.extractor,
    };

    MetadataRegistry.addParameterMetadata(target, propertyKey, metadata);
  };
}

/**
 * @param decorator - parameter injection matching Loopback 4
 * Provides shortcuts like @param.path.string(), @param.query.object()
 */
export const param = Object.assign(
  function (options?: { name?: string; in?: string; required?: boolean; schema?: AnyObject }) {
    return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
      const paramType = options?.in === 'query' ? ParameterType.QUERY : ParameterType.PATH;
      const metadata: IParameterMetadata = {
        index: parameterIndex,
        type: paramType,
        name: options?.name,
        required: options?.required,
        schema: options?.schema,
      };

      MetadataRegistry.addParameterMetadata(target, propertyKey, metadata);
    };
  },
  {
    /**
     * Path parameter decorators
     */
    path: {
      string(name: string) {
        return createParameterDecorator(ParameterType.PATH, name, {
          extractor: (ctx: Context) => ctx.req.param(name),
        });
      },
      number(name: string) {
        return createParameterDecorator(ParameterType.PATH, name, {
          extractor: (ctx: Context) => {
            const value = ctx.req.param(name);
            return value ? Number(value) : undefined;
          },
        });
      },
      boolean(name: string) {
        return createParameterDecorator(ParameterType.PATH, name, {
          extractor: (ctx: Context) => {
            const value = ctx.req.param(name);
            return value === 'true' || value === '1';
          },
        });
      },
    },

    /**
     * Query parameter decorators
     */
    query: {
      string(name: string) {
        return createParameterDecorator(ParameterType.QUERY, name, {
          extractor: (ctx: Context) => ctx.req.query(name),
        });
      },
      number(name: string) {
        return createParameterDecorator(ParameterType.QUERY, name, {
          extractor: (ctx: Context) => {
            const value = ctx.req.query(name);
            return value ? Number(value) : undefined;
          },
        });
      },
      boolean(name: string) {
        return createParameterDecorator(ParameterType.QUERY, name, {
          extractor: (ctx: Context) => {
            const value = ctx.req.query(name);
            return value === 'true' || value === '1';
          },
        });
      },
      object(name: string) {
        return createParameterDecorator(ParameterType.QUERY, name, {
          extractor: (ctx: Context) => {
            const value = ctx.req.query(name);
            if (typeof value === 'string') {
              try {
                return JSON.parse(value);
              } catch {
                return undefined;
              }
            }
            return value;
          },
        });
      },
    },

    /**
     * Header parameter decorator
     */
    header: {
      string(name: string) {
        return createParameterDecorator(ParameterType.HEADER, name, {
          extractor: (ctx: Context) => ctx.req.header(name),
        });
      },
    },

    /**
     * Special filter decorator matching Loopback 4
     * @example @param.filter(User)
     */
    filter<T>(_modelClass: ClassType<T>) {
      return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const metadata: IParameterMetadata = {
          index: parameterIndex,
          type: ParameterType.QUERY,
          name: 'filter',
          extractor: (ctx: Context) => {
            const filterParam = ctx.req.query('filter');
            if (!filterParam) return undefined;

            try {
              return typeof filterParam === 'string' ? JSON.parse(filterParam) : filterParam;
            } catch {
              return undefined;
            }
          },
        };

        MetadataRegistry.addParameterMetadata(target, propertyKey, metadata);
      };
    },

    /**
     * Where clause decorator matching Loopback 4
     */
    where<T>(_modelClass?: ClassType<T>) {
      return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const metadata: IParameterMetadata = {
          index: parameterIndex,
          type: ParameterType.QUERY,
          name: 'where',
          extractor: (ctx: Context) => {
            const whereParam = ctx.req.query('where');
            if (!whereParam) return undefined;

            try {
              return typeof whereParam === 'string' ? JSON.parse(whereParam) : whereParam;
            } catch {
              return undefined;
            }
          },
        };

        MetadataRegistry.addParameterMetadata(target, propertyKey, metadata);
      };
    },
  },
);

/**
 * @requestBody decorator - request body injection matching Loopback 4
 *
 * @param options - Request body options
 *
 * @example
 * ```ts
 * @post('/users')
 * async createUser(
 *   @requestBody({
 *     content: {
 *       'application/json': {
 *         schema: getModelSchemaRef(User)
 *       }
 *     }
 *   }) user: Omit<User, 'id'>
 * ) {
 *   return this.userRepository.create(user);
 * }
 * ```
 */
export function requestBody(options?: {
  description?: string;
  required?: boolean;
  content?: AnyObject;
}) {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const metadata: IParameterMetadata = {
      index: parameterIndex,
      type: ParameterType.BODY,
      required: options?.required !== false, // default to required
      schema: options,
      extractor: async (ctx: Context) => {
        try {
          return await ctx.req.json();
        } catch {
          return ctx.req.parseBody();
        }
      },
    };

    MetadataRegistry.addParameterMetadata(target, propertyKey, metadata);
  };
}

/**
 * @request decorator - inject full request object
 */
export function request() {
  return createParameterDecorator(ParameterType.REQUEST, undefined, {
    extractor: (ctx: Context) => ctx.req,
  });
}

/**
 * @response decorator - inject response object
 */
export function response() {
  return createParameterDecorator(ParameterType.RESPONSE, undefined, {
    extractor: (ctx: Context) => ctx,
  });
}

/**
 * @context decorator - inject Hono context
 */
export function context() {
  return createParameterDecorator(ParameterType.CONTEXT, undefined, {
    extractor: (ctx: Context) => ctx,
  });
}
