export class DIContainer {
  private static instance: DIContainer;
  private registry: Map<string, any>;

  constructor() {
    this.registry = new Map();
  }

  static getInstance(): DIContainer {
    if (!this.instance) {
      this.instance = new DIContainer();
    }

    return this.instance;
  }

  get<E>(key: string) {
    return this.registry.get(key) as E;
  }

  set<E>(key: string, value: E) {
    this.registry.set(key, value);
  }
}
