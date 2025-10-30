import { Entity } from '@/base';
import type { AnyObject, ClassType } from '@/common/types';
import type { Context } from 'hono';
import type { HttpMethod, ParameterType } from './constants';

/**
 * Route metadata stored on controller methods
 */
export interface IRouteMetadata {
  path: string;
  method: HttpMethod;
  methodName: string | symbol;
  responses?: AnyObject;
  description?: string;
  tags?: string[];
  operationId?: string;
  security?: AnyObject[];
  [key: string]: any;
}

/**
 * Parameter metadata stored on controller method parameters
 */
export interface IParameterMetadata<T = any> {
  index: number;
  type: ParameterType;
  name?: string;
  required?: boolean;
  schema?: AnyObject;
  description?: string;
  extractor?: (context: Context) => T;
}

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
 * Model relation metadata
 */
export interface IBelongsToRelationMetadata {
  type: 'belongsTo';
  target: () => ClassType<Entity>;
  foreignKey?: string;
  keyFrom?: string;
  keyTo?: string;
}

export interface RelationMetadata {
  type: 'belongsTo' | 'hasOne' | 'hasMany' | 'hasManyThrough';
  target: string | ClassType<any>;
  foreignKey?: string;
  keyFrom?: string;
  keyTo?: string;
  through?: {
    model: string | ClassType<any>;
    keyFrom?: string;
    keyTo?: string;
  };
  polymorphic?: boolean | { discriminator: string };
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
  scope?: 'Singleton' | 'Transient' | 'Request';
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

/**
 * Authentication metadata
 */
export interface AuthenticateMetadata {
  strategy?: string;
  options?: AnyObject;
}

/**
 * Authorization metadata
 */
export interface AuthorizeMetadata {
  allowedRoles?: string[];
  voters?: Function[];
  resource?: string;
  scopes?: string[];
}
