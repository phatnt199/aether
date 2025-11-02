import { BaseHelper } from '@/base/base.helper';
import { type IClass } from '@/common/types';
import { getError } from '@/utilities';
import { MetadataRegistry } from './registry';
import { BindingScopes, BindingValueTypes, TBindingScope } from './types';

// -------------------------------------------------------------------------------------
export class Binding<T = any> extends BaseHelper {
  private scope: TBindingScope = BindingScopes.SINGLETON;

  public key: string;
  private tags: Set<string>;

  private resolver:
    | { type: 'class'; value: IClass<T> }
    | { type: 'value'; value: T }
    | { type: 'provider'; value: (container: Container) => T };

  private cachedInstance?: T;

  constructor(opts: { key: string; namespace?: string }) {
    super({ scope: opts.key });
    this.tags = new Set([]);

    this.key = opts.key;

    const keyParts = opts.key.split('.');
    if (keyParts.length > 1) {
      const [namespace] = keyParts;
      this.setTags(namespace);
    }
  }

  toClass(value: IClass<T>): this {
    this.resolver = { type: BindingValueTypes.CLASS, value };
    return this;
  }

  toValue(value: T): this {
    this.resolver = { type: BindingValueTypes.VALUE, value };
    return this;
  }

  toProvider(value: (container: Container) => T): this {
    this.resolver = { type: BindingValueTypes.PROVIDER, value };
    return this;
  }

  setScope(scope: TBindingScope): this {
    this.scope = scope;
    return this;
  }

  setTags(...tags: string[]): this {
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

    const { type: resolverType } = this.resolver;
    switch (resolverType) {
      case BindingValueTypes.VALUE: {
        instance = this.resolver.value;
        break;
      }
      case BindingValueTypes.PROVIDER: {
        instance = this.resolver.value(container);
        break;
      }
      case BindingValueTypes.CLASS: {
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
    const binding = new Binding<T>({ key: keyStr });
    this.bindings.set(keyStr, binding as Binding);
    return binding;
  }

  isBound(key: string | symbol): boolean {
    const keyStr = String(key);
    return this.bindings.has(keyStr);
  }

  getBinding<T>(opts: { key: string | symbol }): Binding<T> | undefined {
    const key = String(opts.key);
    const binding = this.bindings.get(key);
    return binding;
  }

  unbind(opts: { key: string | symbol }): boolean {
    const key = String(opts.key);
    return this.bindings.delete(key);
  }

  get<T>(opts: { key: string | symbol }): T {
    const binding = this.getBinding<T>(opts);
    if (!binding) {
      throw getError({
        message: `No binding found for key: ${opts.key.toString()}`,
      });
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

    const dependencies: any[] = [];
    const sortedDeps = [...injectMetadata].sort((a, b) => a.index - b.index);

    for (const meta of sortedDeps) {
      try {
        const dep = this.get(meta);
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

  findByTag(opts: { tag: string }): Binding[] {
    const rs: Binding[] = [];
    for (const [_k, binding] of this.bindings) {
      if (!binding.hasTag(opts.tag)) {
        continue;
      }

      rs.push(binding);
    }

    return rs;
  }

  getAllByTag<T>(opts: { tag: string }): T[] {
    const bindings = this.findByTag(opts);
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
