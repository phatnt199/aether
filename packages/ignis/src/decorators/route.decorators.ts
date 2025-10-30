import { HttpMethod } from '@/core/metadata/constants';
import { MetadataRegistry } from '@/core/metadata/registry';
import type { RouteMetadata, ControllerMetadata } from '@/core/metadata/types';
import type { AnyObject } from '@/common/types';

/**
 * Route options matching Loopback 4's RestControllerSpec
 */
export interface RouteOptions {
  responses?: AnyObject;
  description?: string;
  tags?: string[];
  operationId?: string;
  security?: AnyObject[];
  summary?: string;
  deprecated?: boolean;
  [key: string]: any;
}

/**
 * Controller decorator - defines base path and metadata for a controller class
 * Matches @api() from Loopback 4
 *
 * @param options - Controller options including basePath
 *
 * @example
 * ```ts
 * @api({ basePath: '/users' })
 * export class UserController {
 *   // ...
 * }
 * ```
 */
export function api(options: { basePath?: string; tags?: string[]; description?: string } = {}) {
  return function (target: Function) {
    const metadata: ControllerMetadata = {
      basePath: options.basePath || '/',
      tags: options.tags,
      description: options.description,
    };

    MetadataRegistry.setControllerMetadata(target as any, metadata);
  };
}

/**
 * Internal helper to create HTTP method decorators
 */
function createHttpMethodDecorator(method: HttpMethod) {
  return function (path: string = '/', options: RouteOptions = {}) {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) {
      const metadata: RouteMetadata = {
        path,
        method,
        methodName: propertyKey,
        ...options,
      };

      MetadataRegistry.addRouteMetadata(target.constructor, propertyKey, metadata);

      return descriptor;
    };
  };
}

/**
 * @get decorator - HTTP GET method
 * Matches Loopback 4's @get()
 *
 * @param path - Route path
 * @param options - Route options
 *
 * @example
 * ```ts
 * @get('/users')
 * async getUsers() {
 *   return this.userRepository.find();
 * }
 * ```
 */
export const get = createHttpMethodDecorator(HttpMethod.GET);

/**
 * @post decorator - HTTP POST method
 * Matches Loopback 4's @post()
 *
 * @param path - Route path
 * @param options - Route options
 *
 * @example
 * ```ts
 * @post('/users', {
 *   responses: {
 *     '200': {
 *       description: 'User created',
 *       content: { 'application/json': { schema: {...} } }
 *     }
 *   }
 * })
 * async createUser(@requestBody() data: CreateUserDto) {
 *   return this.userRepository.create(data);
 * }
 * ```
 */
export const post = createHttpMethodDecorator(HttpMethod.POST);

/**
 * @put decorator - HTTP PUT method
 * Matches Loopback 4's @put()
 *
 * @param path - Route path
 * @param options - Route options
 *
 * @example
 * ```ts
 * @put('/users/{id}')
 * async replaceUser(@param.path.string('id') id: string, @requestBody() data: User) {
 *   return this.userRepository.replaceById(id, data);
 * }
 * ```
 */
export const put = createHttpMethodDecorator(HttpMethod.PUT);

/**
 * @patch decorator - HTTP PATCH method
 * Matches Loopback 4's @patch()
 *
 * @param path - Route path
 * @param options - Route options
 *
 * @example
 * ```ts
 * @patch('/users/{id}')
 * async updateUser(@param.path.string('id') id: string, @requestBody() data: Partial<User>) {
 *   return this.userRepository.updateById(id, data);
 * }
 * ```
 */
export const patch = createHttpMethodDecorator(HttpMethod.PATCH);

/**
 * @del decorator - HTTP DELETE method
 * Matches Loopback 4's @del()
 *
 * @param path - Route path
 * @param options - Route options
 *
 * @example
 * ```ts
 * @del('/users/{id}')
 * async deleteUser(@param.path.string('id') id: string) {
 *   return this.userRepository.deleteById(id);
 * }
 * ```
 */
export const del = createHttpMethodDecorator(HttpMethod.DELETE);

/**
 * @head decorator - HTTP HEAD method
 */
export const head = createHttpMethodDecorator(HttpMethod.HEAD);

/**
 * @options decorator - HTTP OPTIONS method
 */
export const options = createHttpMethodDecorator(HttpMethod.OPTIONS);

/**
 * Alias exports matching Loopback 4 naming
 */
export { get as getRoute, post as postRoute, put as putRoute, patch as patchRoute, del as deleteRoute };
