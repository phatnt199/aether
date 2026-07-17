import { type AnyType } from '@/common';
import { getClientError } from '@/utilities';
import { BaseApiService } from '../services';

export function api() {
  return function (_target: BaseApiService, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: BaseApiService, ...args: AnyType[]) {
      try {
        const result = await Reflect.apply(originalMethod, this, args);
        return result;
      } catch (error) {
        this.logger.error(
          '[%s] resource: %s | error: %o',
          propertyKey,
          this.resource,
          JSON.stringify(error),
        );
        throw getClientError(error);
      }
    };

    return descriptor;
  };
}
