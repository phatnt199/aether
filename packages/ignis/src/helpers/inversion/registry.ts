import type { IClass } from '@/common/types';
import { MetadataKeys } from './keys';
import type {
  IControllerMetadata,
  IInjectMetadata,
  IInjectableMetadata,
  IPropertyMetadata,
} from './types';

/**
 * Central metadata registry for storing and retrieving decorator metadata
 */
export class MetadataRegistry {
  // -----------------------------------------------------------------
  // Controller Metadata
  // -----------------------------------------------------------------
  static setControllerMetadata<T extends Object = Object>(opts: {
    target: T;
    metadata: IControllerMetadata;
  }): void {
    const { target, metadata } = opts;
    Reflect.defineMetadata(MetadataKeys.CONTROLLER, metadata, target);
  }

  static getControllerMetadata<T extends Object = Object>(opts: {
    target: T;
  }): IControllerMetadata | undefined {
    const { target } = opts;
    return Reflect.getMetadata(MetadataKeys.CONTROLLER, target);
  }

  // -----------------------------------------------------------------
  // Route Metadata
  // -----------------------------------------------------------------
  /* static addRouteMetadata(
    target: IClass<any>,
    methodName: string | symbol,
    metadata: TRouteMetadata,
  ): void {
    const routes = this.getRouteMetadata(target) || [];
    routes.push({ ...metadata, methodName });
    Reflect.defineMetadata(MetadataKeys.ROUTES, routes, target);
  }

  static getRouteMetadata(target: IClass<any>): TRouteMetadata[] {
    return Reflect.getMetadata(MetadataKeys.ROUTES, target) || [];
  } */

  // -----------------------------------------------------------------
  // Property Metadata
  // -----------------------------------------------------------------
  static setPropertyMetadata<T extends Object = Object>(opts: {
    target: T;
    propertyName: string | symbol;
    metadata: IPropertyMetadata;
  }): void {
    const { target, propertyName, metadata } = opts;

    let properties = this.getPropertiesMetadata({ target });
    if (!properties) {
      properties = new Map<string | symbol, IPropertyMetadata>();
    }

    properties.set(propertyName, metadata);
    Reflect.defineMetadata(MetadataKeys.PROPERTIES, properties, target.constructor);
  }

  static getPropertiesMetadata<T extends Object = Object>(opts: {
    target: T;
  }): Map<string | symbol, IPropertyMetadata> | undefined {
    const { target } = opts;
    return Reflect.getMetadata(MetadataKeys.PROPERTIES, target.constructor);
  }

  static getPropertyMetadata<T extends Object = Object>(opts: {
    target: T;
    propertyName: string | symbol;
  }): IPropertyMetadata | undefined {
    const { target, propertyName } = opts;
    const properties = this.getPropertiesMetadata({ target });
    return properties?.get(propertyName);
  }

  // -----------------------------------------------------------------
  // Injection Metadata
  // -----------------------------------------------------------------
  static setInjectMetadata<T extends Object = Object>(opts: {
    target: T;
    index: number;
    metadata: IInjectMetadata;
  }): void {
    const { target, index, metadata } = opts;
    const injects = Reflect.getMetadata(MetadataKeys.INJECT, target) || [];
    injects[index] = metadata;
    Reflect.defineMetadata(MetadataKeys.INJECT, injects, target);
  }

  static getInjectMetadata<T extends Object = Object>(opts: {
    target: T;
  }): IInjectMetadata[] | undefined {
    const { target } = opts;
    return Reflect.getMetadata(MetadataKeys.INJECT, target);
  }

  // -----------------------------------------------------------------
  static setInjectableMetadata<T extends Object = Object>(opts: {
    target: T;
    metadata: IInjectableMetadata;
  }): void {
    const { target, metadata } = opts;
    Reflect.defineMetadata(MetadataKeys.INJECTABLE, metadata, target);
  }

  static getInjectableMetadata<T extends Object = Object>(opts: {
    target: T;
  }): IInjectableMetadata | undefined {
    const { target } = opts;
    return Reflect.getMetadata(MetadataKeys.INJECTABLE, target);
  }

  // -----------------------------------------------------------------
  static getMethodNames<T = any>(opts: { target: IClass<T> }): string[] {
    const { target } = opts;
    const prototype = target.prototype;
    const methods = Object.getOwnPropertyNames(prototype).filter(
      name => name !== 'constructor' && typeof prototype[name] === 'function',
    );
    return methods;
  }

  static clearMetadata<T extends Object = Object>(opts: { target: T }): void {
    const { target } = opts;
    const keys = Reflect.getMetadataKeys(target);

    for (const key of keys) {
      Reflect.deleteMetadata(key, target);
    }
  }
}
