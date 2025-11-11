import type { TConstValue } from '@/common/types';

// ----------------------------------------------------------------------------------------------------------------------------------------
// Binding
// ----------------------------------------------------------------------------------------------------------------------------------------
export class BindingScopes {
  static readonly SINGLETON = 'singleton';
  static readonly TRANSIENT = 'transient';
}
export type TBindingScope = TConstValue<typeof BindingScopes>;

export class BindingValueTypes {
  static readonly CLASS = 'class';
  static readonly VALUE = 'value';
  static readonly PROVIDER = 'provider';
}

export type TBindingValueType = TConstValue<typeof BindingValueTypes>;

export interface IBindingTag {
  [name: string]: any;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Metadata
// ----------------------------------------------------------------------------------------------------------------------------------------
/* export interface IRouteMetadata {
  path: string;
  method: THttpMethod;
  methodName: string | symbol;
  responses?: AnyObject;
  description?: string;
  tags?: string[];
  operationId?: string;
  security?: AnyObject[];
  [key: string]: any;
} */

// export type TRouteMetadata = IRouteMetadata;
// export type TPropertyMetadata = IPropertyMetadata;

export interface IControllerMetadata {
  basePath?: string;
  tags?: string[];
  description?: string;
}

export interface IPropertyMetadata {
  bindingKey: string | symbol;
  optional?: boolean;
  [key: string]: any;
}

export interface IInjectMetadata {
  key: string | symbol;
  index: number;
  optional?: boolean;
}

export interface IInjectableMetadata {
  scope?: TBindingScope;
  tags?: Record<string, any>;
}

/* export interface IMiddlewareMetadata {
  handler: Function;
  priority?: number;
}

export interface IInterceptorMetadata {
  handler: Function;
  group?: string;
} */
