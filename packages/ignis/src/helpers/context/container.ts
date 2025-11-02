import { BaseHelper } from '@/base/base.helper';
import { BindingScopes, type IClass, type TBindingScope } from '@/common/types';
import { getError } from '@/utilities';
import { MetadataRegistry } from './registry';

// -------------------------------------------------------------------------------------
export class Binding<T = any> {
  private scope: TBindingScope = 'singleton';
  private tags: Set<string> = new Set();
  private resolver:
    | { type: 'class'; value: IClass<T> }
    | { type: 'value'; value: T }
    | { type: 'provider'; value: (container: Container) => T };

  private cachedInstance?: T;

  constructor(public readonly key: string | symbol) {}

  toClass(value: IClass<T>): this {
    this.resolver = { type: 'class', value };
    return this;
  }

  toValue(value: T): this {
    this.resolver = { type: 'value', value };
    return this;
  }

  toProvider(value: (container: Container) => T): this {
    this.resolver = { type: 'provider', value };
    return this;
  }

  inScope(scope: TBindingScope): this {
    this.scope = scope;
    return this;
  }

  tag(...tags: string[]): this {
    tags.forEach(t => this.tags.add(t));
    return this;
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  getTags(): string[] {
    return Array.from(this.tags);
  }

  getScope(): TBindingScope {
    return this.scope;
  }

  getValue(container: Container): T {
    if (this.scope === BindingScopes.SINGLETON && this.cachedInstance !== undefined) {
      return this.cachedInstance;
    }

    let instance: T;

    const resolverType = this.resolver.type;
    switch (resolverType) {
      case 'value': {
        instance = this.resolver.value;
        break;
      }
      case 'provider': {
        instance = this.resolver.value(container);
        break;
      }
      case 'class': {
        instance = container.instantiate(this.resolver.value);
        break;
      }
      default: {
        throw getError({
          message: `[getValue] Invalid value type | valueType: ${resolverType}`,
        });
      }
    }

    if (this.scope === BindingScopes.SINGLETON) {
      this.cachedInstance = instance;
    }

    return instance;
  }

  clearCache() {
    this.cachedInstance = undefined;
  }
}

// -------------------------------------------------------------------------------------
export class Container extends BaseHelper {
  private bindings = new Map<string | symbol, Binding>();

  constructor(opts?: { scope: string }) {
    super({ scope: opts?.scope ?? Container.name });
  }

  bind<T>(key: string | symbol): Binding<T> {
    const keyStr = String(key);
    const binding = new Binding<T>(key);
    this.bindings.set(keyStr, binding as Binding);
    return binding;
  }

  isBound(key: string | symbol): boolean {
    const keyStr = String(key);
    return this.bindings.has(keyStr);
  }

  getBinding<T>(key: string | symbol): Binding<T> | undefined {
    const keyStr = String(key);
    const binding = this.bindings.get(keyStr);
    return binding;
  }

  unbind(key: string | symbol): boolean {
    const keyStr = String(key);
    return this.bindings.delete(keyStr);
  }

  get<T>(key: string | symbol): T {
    const binding = this.getBinding<T>(key);
    if (!binding) {
      throw new Error(`No binding found for key: ${String(key)}`);
    }

    return binding.getValue(this);
  }

  resolve<T>(cls: IClass<T>): T {
    return this.instantiate(cls);
  }

  instantiate<T>(cls: IClass<T>): T {
    const injectMetadata = MetadataRegistry.getInjectMetadata(cls);
    if (!injectMetadata || injectMetadata.length === 0) {
      return new cls();
    }

    // Resolve dependencies
    const dependencies: any[] = [];
    const sorted = [...injectMetadata].sort((a, b) => a.index - b.index);

    for (const meta of sorted) {
      try {
        const dep = this.get(meta.key);
        dependencies[meta.index] = dep;
      } catch (error) {
        if (meta.optional) {
          dependencies[meta.index] = undefined;
          continue;
        }

        throw error;
      }
    }

    return new cls(...dependencies);
  }

  findByTag(tag: string): Binding[] {
    const results: Binding[] = [];
    for (const [_k, binding] of this.bindings) {
      if (binding.hasTag(tag)) {
        results.push(binding);
      }
    }
    return results;
  }

  getAllByTag<T>(tag: string): T[] {
    const bindings = this.findByTag(tag);
    return bindings.map(b => b.getValue(this) as T);
  }

  clear(): void {
    for (const [_key, binding] of this.bindings) {
      binding.clearCache();
    }
  }

  reset(): void {
    this.bindings.clear();
  }
}
