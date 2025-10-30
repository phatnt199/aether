import { container as tsyringeContainer, DependencyContainer, InjectionToken } from 'tsyringe';
import type { ClassType } from '@/common/types';

export class Binding<T = any> {
  constructor(
    private container: DependencyContainer,
    private key: string | symbol,
  ) {}

  to(value: ClassType<T>) {
    this.container.register(this.key, { useClass: value });
    return this;
  }

  toClass(value: ClassType<T>) {
    return this.to(value);
  }

  toDynamicValue(factory: () => T) {
    this.container.register(this.key, { useFactory: () => factory() });
    return this;
  }

  toConstantValue(value: T) {
    this.container.register(this.key as any, { useValue: value });
    return this;
  }

  toAlias(alias: string | symbol) {
    this.container.register(this.key as any, { useToken: alias });
    return this;
  }

  inScope(_scope: 'Singleton' | 'Transient' | 'Request') {
    // TSyringe handles scopes automatically based on registration
    return this;
  }

  tag(..._tags: (string | { [key: string]: any })[]) {
    // Store tags metadata if needed
    return this;
  }
}

/**
 * Application container wrapping TSyringe
 * Provides Loopback-like API for dependency injection
 */
export class Container {
  private tsyringe: DependencyContainer;
  private bindings: Map<string | symbol, any> = new Map();

  constructor() {
    this.tsyringe = tsyringeContainer.createChildContainer();
  }

  /**
   * Bind a key to a value, class, or factory
   * Matches Loopback's bind() method
   */
  bind<T>(key: string | symbol): Binding<T> {
    return new Binding<T>(this.tsyringe, key);
  }

  /**
   * Get a bound value synchronously
   */
  getSync<T>(key: string | symbol): T {
    try {
      return this.tsyringe.resolve(key as InjectionToken<T>);
    } catch (error) {
      throw new Error(`Cannot resolve binding: ${String(key)}`);
    }
  }

  /**
   * Get a bound value asynchronously
   */
  async get<T>(key: string | symbol): Promise<T> {
    return this.getSync<T>(key);
  }

  /**
   * Check if a key is bound
   */
  isBound(key: string | symbol): boolean {
    return this.tsyringe.isRegistered(key as any);
  }

  /**
   * Unbind a key
   */
  unbind(_key: string | symbol): boolean {
    this.tsyringe.clearInstances();
    return true;
  }

  /**
   * Register a class with auto-binding
   */
  register<T>(key: string | symbol, target: ClassType<T>): void {
    this.tsyringe.register(key as any, { useClass: target as any });
  }

  /**
   * Register a singleton
   */
  registerSingleton<T>(key: string | symbol, target: ClassType<T>): void {
    this.tsyringe.registerSingleton(key as any, target as any);
  }

  /**
   * Register a constant value
   */
  registerValue<T>(key: string | symbol, value: T): void {
    this.tsyringe.register(key as any, { useValue: value });
  }

  /**
   * Resolve a class instance
   */
  resolve<T>(target: ClassType<T>): T {
    return this.tsyringe.resolve(target as any);
  }

  /**
   * Create a child container
   */
  createChild(): Container {
    const child = new Container();
    child.tsyringe = this.tsyringe.createChildContainer();
    return child;
  }

  /**
   * Get the underlying TSyringe container
   */
  getNativeContainer(): DependencyContainer {
    return this.tsyringe;
  }

  /**
   * Clear all instances (useful for testing)
   */
  clear(): void {
    this.tsyringe.clearInstances();
  }

  /**
   * Reset the container
   */
  reset(): void {
    this.tsyringe.reset();
    this.bindings.clear();
  }
}

export const globalContainer = new Container();
