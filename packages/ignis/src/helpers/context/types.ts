import { HttpMethods } from '@/common';
import type { AnyObject, TBindingScope } from '@/common/types';

/**
 * Route metadata stored on controller methods
 */
export interface IRouteMetadata {
  path: string;
  method: HttpMethods;
  methodName: string | symbol;
  responses?: AnyObject;
  description?: string;
  tags?: string[];
  operationId?: string;
  security?: AnyObject[];
  [key: string]: any;
}

export type RouteMetadata = IRouteMetadata;
export type ControllerMetadata = IControllerMetadata;
export type PropertyMetadata = IPropertyMetadata;

/**
 * Controller metadata
 */
export interface IControllerMetadata {
  basePath?: string;
  tags?: string[];
  description?: string;
}

/**
 * Model property metadata
 */
export interface IPropertyMetadata {
  type?: string;
  required?: boolean;
  id?: boolean;
  generated?: boolean;
  default?: () => any;
  description?: string;
  jsonSchema?: AnyObject;
  [key: string]: any;
}

/**
 * Dependency injection metadata
 */
export interface InjectMetadata {
  key: string | symbol;
  index: number;
  optional?: boolean;
}

/**
 * Injectable class metadata
 */
export interface InjectableMetadata {
  scope?: TBindingScope;
  tags?: Record<string, any>;
}

/**
 * Middleware metadata
 */
export interface MiddlewareMetadata {
  handler: Function;
  priority?: number;
}

/**
 * Interceptor metadata
 */
export interface InterceptorMetadata {
  handler: Function;
  group?: string;
}
