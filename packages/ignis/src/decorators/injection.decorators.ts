import {
  injectable as tsyringeInjectable,
  inject as tsyringeInject,
} from "tsyringe";
import { MetadataRegistry } from "@/core/metadata/registry";
import type { InjectMetadata, InjectableMetadata } from "@/core/metadata/types";
import { BindingScope } from "@/core/metadata/constants";

/**
 * Options for @injectable decorator
 */
export interface InjectableOptions {
  scope?: "Singleton" | "Transient" | "Request";
  tags?: Record<string, any>;
}

/**
 * Options for @inject decorator
 */
export interface InjectOptions {
  optional?: boolean;
}

/**
 * @injectable decorator - marks a class as injectable
 * Matches Loopback 4's @injectable()
 *
 * @param options - Injectable options
 *
 * @example
 * ```ts
 * @injectable({ scope: BindingScope.SINGLETON })
 * export class UserService {
 *   constructor(
 *     @inject('repositories.UserRepository')
 *     private userRepository: UserRepository
 *   ) {}
 * }
 * ```
 */
export function injectable(options: InjectableOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    // Store metadata
    const metadata: InjectableMetadata = {
      scope: options.scope || BindingScope.SINGLETON,
      tags: options.tags,
    };

    MetadataRegistry.setInjectableMetadata(target, metadata);

    // Apply TSyringe's injectable
    return tsyringeInjectable()(target);
  };
}

/**
 * @inject decorator - injects a dependency by key
 * Matches Loopback 4's @inject()
 *
 * @param key - The binding key or token
 * @param options - Injection options
 *
 * @example
 * ```ts
 * constructor(
 *   @inject('repositories.UserRepository')
 *   private userRepository: UserRepository,
 *
 *   @inject(CoreBindings.APPLICATION_INSTANCE)
 *   private application: Application
 * ) {}
 * ```
 */
export function inject(key: string | symbol, options?: InjectOptions) {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    // Store metadata
    const metadata: InjectMetadata = {
      key,
      index: parameterIndex,
      optional: options?.optional,
    };

    MetadataRegistry.addInjectMetadata(target, parameterIndex, metadata);

    // Apply TSyringe's inject
    return tsyringeInject(key as any)(
      target,
      propertyKey as any,
      parameterIndex,
    );
  };
}

/**
 * Helper decorator for scope-specific injection
 */
export namespace Inject {
  /**
   * Inject as singleton (shared across the application)
   */
  export function singleton(key: string | symbol, options?: InjectOptions) {
    return inject(key, options);
  }

  /**
   * Inject as transient (new instance every time)
   */
  export function transient(key: string | symbol, options?: InjectOptions) {
    return inject(key, options);
  }
}

/**
 * Binding scope constants matching Loopback 4
 */
export { BindingScope };
export const BINDING_SCOPE = BindingScope;
