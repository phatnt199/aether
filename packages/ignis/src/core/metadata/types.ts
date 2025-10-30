import type { Context } from 'hono';
import type { HttpMethod, ParameterType } from './constants';
import type { AnyObject, ClassType } from '@/common/types';

/**
 * Route metadata stored on controller methods
 */
export interface RouteMetadata {
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
export interface ParameterMetadata {
  index: number;
  type: ParameterType;
  name?: string;
  required?: boolean;
  schema?: AnyObject;
  description?: string;
  extractor?: (ctx: Context) => any;
}

/**
 * Controller metadata
 */
export interface ControllerMetadata {
  basePath?: string;
  tags?: string[];
  description?: string;
}

/**
 * Model property metadata
 */
export interface PropertyMetadata {
  type?: string | Function;
  required?: boolean;
  id?: boolean;
  generated?: boolean;
  default?: any;
  description?: string;
  jsonSchema?: AnyObject;
  [key: string]: any;
}

/**
 * Model relation metadata
 */
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
