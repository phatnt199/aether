import type { IClass } from '@/common/types';
import 'reflect-metadata';
import { METADATA_KEY } from './keys';
import type {
  ControllerMetadata,
  InjectMetadata,
  InjectableMetadata,
  PropertyMetadata,
  RouteMetadata,
} from './types';

/**
 * Central metadata registry for storing and retrieving decorator metadata
 */
export class MetadataRegistry {
  // -----------------------------------------------------------------
  // Controller Metadata
  // -----------------------------------------------------------------
  static setControllerMetadata(target: IClass<any>, metadata: ControllerMetadata): void {
    Reflect.defineMetadata(METADATA_KEY.CONTROLLER, metadata, target);
  }

  static getControllerMetadata(target: IClass<any>): ControllerMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEY.CONTROLLER, target);
  }

  // -----------------------------------------------------------------
  // Route Metadata
  // -----------------------------------------------------------------
  static addRouteMetadata(
    target: IClass<any>,
    methodName: string | symbol,
    metadata: RouteMetadata,
  ): void {
    const routes = this.getRouteMetadata(target) || [];
    routes.push({ ...metadata, methodName });
    Reflect.defineMetadata(METADATA_KEY.ROUTES, routes, target);
  }

  static getRouteMetadata(target: IClass<any>): RouteMetadata[] {
    return Reflect.getMetadata(METADATA_KEY.ROUTES, target) || [];
  }

  // -----------------------------------------------------------------
  // Model Metadata
  // -----------------------------------------------------------------
  static setModelMetadata(target: IClass<any>, metadata: { name?: string; settings?: any }): void {
    Reflect.defineMetadata(METADATA_KEY.MODEL, metadata, target);
  }

  static getModelMetadata(target: IClass<any>): { name?: string; settings?: any } | undefined {
    return Reflect.getMetadata(METADATA_KEY.MODEL, target);
  }

  // -----------------------------------------------------------------
  // Property Metadata
  // -----------------------------------------------------------------
  static addPropertyMetadata(
    target: any,
    propertyName: string | symbol,
    metadata: PropertyMetadata,
  ): void {
    const properties = this.getPropertiesMetadata(target) || new Map();
    properties.set(propertyName, metadata);
    Reflect.defineMetadata(METADATA_KEY.PROPERTIES, properties, target.constructor);
  }

  static getPropertiesMetadata(target: any): Map<string | symbol, PropertyMetadata> | undefined {
    return Reflect.getMetadata(METADATA_KEY.PROPERTIES, target.constructor);
  }

  static getPropertyMetadata(
    target: any,
    propertyName: string | symbol,
  ): PropertyMetadata | undefined {
    const properties = this.getPropertiesMetadata(target);
    return properties?.get(propertyName);
  }

  // -----------------------------------------------------------------
  // Injection Metadata
  // -----------------------------------------------------------------
  static addInjectMetadata(target: any, index: number, metadata: InjectMetadata): void {
    const injects = Reflect.getMetadata(METADATA_KEY.INJECT, target) || [];
    injects[index] = metadata;
    Reflect.defineMetadata(METADATA_KEY.INJECT, injects, target);
  }

  static getInjectMetadata(target: any): InjectMetadata[] | undefined {
    return Reflect.getMetadata(METADATA_KEY.INJECT, target);
  }

  static setInjectableMetadata(target: IClass<any>, metadata: InjectableMetadata): void {
    Reflect.defineMetadata(METADATA_KEY.INJECTABLE, metadata, target);
  }

  static getInjectableMetadata(target: IClass<any>): InjectableMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEY.INJECTABLE, target);
  }

  // -----------------------------------------------------------------
  // Utility Methods
  // -----------------------------------------------------------------

  /**
   * Get all method names of a class (excluding constructor)
   */
  static getMethodNames(target: IClass<any>): string[] {
    const prototype = target.prototype;
    const methods = Object.getOwnPropertyNames(prototype).filter(
      name => name !== 'constructor' && typeof prototype[name] === 'function',
    );
    return methods;
  }

  /**
   * Check if a class has any route metadata
   */
  static hasRoutes(target: IClass<any>): boolean {
    const routes = this.getRouteMetadata(target);
    return routes && routes.length > 0;
  }

  /**
   * Clear all metadata for a target (useful for testing)
   */
  static clearMetadata(target: any): void {
    const keys = Reflect.getMetadataKeys(target);
    keys.forEach(key => {
      Reflect.deleteMetadata(key, target);
    });
  }
}
