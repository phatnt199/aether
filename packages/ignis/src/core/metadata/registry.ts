import type { ClassType } from '@/common/types';
import 'reflect-metadata';
import { METADATA_KEY } from './constants';
import type {
  AuthenticateMetadata,
  AuthorizeMetadata,
  IControllerMetadata,
  InjectMetadata,
  InjectableMetadata,
  IParameterMetadata,
  IPropertyMetadata,
  RelationMetadata,
  IRouteMetadata,
} from './types';

/**
 * Central metadata registry for storing and retrieving decorator metadata
 */
export class MetadataRegistry {
  // ==================== Controller Metadata ====================

  static setControllerMetadata(target: ClassType<any>, metadata: IControllerMetadata): void {
    Reflect.defineMetadata(METADATA_KEY.CONTROLLER, metadata, target);
  }

  static getControllerMetadata(target: ClassType<any>): IControllerMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEY.CONTROLLER, target);
  }

  // ==================== Route Metadata ====================

  static addRouteMetadata(
    target: ClassType<any>,
    methodName: string | symbol,
    metadata: IRouteMetadata,
  ): void {
    const routes = this.getRouteMetadata(target) || [];
    routes.push({ ...metadata, methodName });
    Reflect.defineMetadata(METADATA_KEY.ROUTES, routes, target);
  }

  static getRouteMetadata(target: ClassType<any>): IRouteMetadata[] {
    return Reflect.getMetadata(METADATA_KEY.ROUTES, target) || [];
  }

  // ==================== Parameter Metadata ====================

  static addParameterMetadata(
    target: any,
    methodName: string | symbol,
    metadata: IParameterMetadata,
  ): void {
    const key = `${METADATA_KEY.PARAMETERS.toString()}:${String(methodName)}`;
    const parameters = Reflect.getMetadata(key, target) || [];
    parameters.push(metadata);
    Reflect.defineMetadata(key, parameters, target);
  }

  static getParameterMetadata(
    target: any,
    methodName: string | symbol,
  ): IParameterMetadata[] | undefined {
    const key = `${METADATA_KEY.PARAMETERS.toString()}:${String(methodName)}`;
    return Reflect.getMetadata(key, target);
  }

  // ==================== Model Metadata ====================

  static setModelMetadata(
    target: ClassType<any>,
    metadata: { name?: string; settings?: any },
  ): void {
    Reflect.defineMetadata(METADATA_KEY.MODEL, metadata, target);
  }

  static getModelMetadata(target: ClassType<any>): { name?: string; settings?: any } | undefined {
    return Reflect.getMetadata(METADATA_KEY.MODEL, target);
  }

  // ==================== Property Metadata ====================

  static addPropertyMetadata(
    target: any,
    propertyName: string | symbol,
    metadata: IPropertyMetadata,
  ): void {
    const properties = this.getPropertiesMetadata(target) || new Map();
    properties.set(propertyName, metadata);
    Reflect.defineMetadata(METADATA_KEY.PROPERTIES, properties, target.constructor);
  }

  static getPropertiesMetadata(target: any): Map<string | symbol, IPropertyMetadata> | undefined {
    return Reflect.getMetadata(METADATA_KEY.PROPERTIES, target.constructor);
  }

  static getPropertyMetadata(
    target: any,
    propertyName: string | symbol,
  ): IPropertyMetadata | undefined {
    const properties = this.getPropertiesMetadata(target);
    return properties?.get(propertyName);
  }

  // ==================== Relation Metadata ====================

  static addRelationMetadata(
    target: any,
    propertyName: string | symbol,
    metadata: RelationMetadata,
  ): void {
    const relations = this.getRelationsMetadata(target) || new Map();
    relations.set(propertyName, metadata);
    Reflect.defineMetadata(METADATA_KEY.RELATIONS, relations, target.constructor);
  }

  static getRelationsMetadata(target: any): Map<string | symbol, RelationMetadata> | undefined {
    return Reflect.getMetadata(METADATA_KEY.RELATIONS, target.constructor);
  }

  static getRelationMetadata(
    target: any,
    propertyName: string | symbol,
  ): RelationMetadata | undefined {
    const relations = this.getRelationsMetadata(target);
    return relations?.get(propertyName);
  }

  // ==================== Injection Metadata ====================

  static addInjectMetadata(target: any, index: number, metadata: InjectMetadata): void {
    const injects = Reflect.getMetadata(METADATA_KEY.INJECT, target) || [];
    injects[index] = metadata;
    Reflect.defineMetadata(METADATA_KEY.INJECT, injects, target);
  }

  static getInjectMetadata(target: any): InjectMetadata[] | undefined {
    return Reflect.getMetadata(METADATA_KEY.INJECT, target);
  }

  static setInjectableMetadata(target: ClassType<any>, metadata: InjectableMetadata): void {
    Reflect.defineMetadata(METADATA_KEY.INJECTABLE, metadata, target);
  }

  static getInjectableMetadata(target: ClassType<any>): InjectableMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEY.INJECTABLE, target);
  }

  // ==================== Authentication Metadata ====================

  static setAuthenticateMetadata(
    target: any,
    methodName: string | symbol,
    metadata: AuthenticateMetadata,
  ): void {
    const key = `${METADATA_KEY.AUTHENTICATE.toString()}:${String(methodName)}`;
    Reflect.defineMetadata(key, metadata, target);
  }

  static getAuthenticateMetadata(
    target: any,
    methodName: string | symbol,
  ): AuthenticateMetadata | undefined {
    const key = `${METADATA_KEY.AUTHENTICATE.toString()}:${String(methodName)}`;
    return Reflect.getMetadata(key, target);
  }

  // ==================== Authorization Metadata ====================

  static setAuthorizeMetadata(
    target: any,
    methodName: string | symbol,
    metadata: AuthorizeMetadata,
  ): void {
    const key = `${METADATA_KEY.AUTHORIZE.toString()}:${String(methodName)}`;
    Reflect.defineMetadata(key, metadata, target);
  }

  static getAuthorizeMetadata(
    target: any,
    methodName: string | symbol,
  ): AuthorizeMetadata | undefined {
    const key = `${METADATA_KEY.AUTHORIZE.toString()}:${String(methodName)}`;
    return Reflect.getMetadata(key, target);
  }

  // ==================== Utility Methods ====================

  /**
   * Get all method names of a class (excluding constructor)
   */
  static getMethodNames(target: ClassType<any>): string[] {
    const prototype = target.prototype;
    const methods = Object.getOwnPropertyNames(prototype).filter(
      name => name !== 'constructor' && typeof prototype[name] === 'function',
    );
    return methods;
  }

  /**
   * Check if a class has any route metadata
   */
  static hasRoutes(target: ClassType<any>): boolean {
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
