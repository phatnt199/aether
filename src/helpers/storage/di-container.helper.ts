import { AnyObject } from '@/common';

export class DIContainerHelper<T extends object = AnyObject> {
  private static instance: DIContainerHelper;
  private container: T;

  constructor() {
    this.container = Object.assign({});
  }

  static getInstance<T extends object = AnyObject>() {
    if (!this.instance) {
      this.instance = new DIContainerHelper<T>();
    }

    return this.instance;
  }

  static newInstance<T extends object = AnyObject>() {
    return new DIContainerHelper<T>();
  }

  get<R>(key: keyof T) {
    return this.container[key] as R;
  }

  set<R>(key: string, value: R) {
    this.container = Object.assign(this.container, { [key]: value });
  }

  keys() {
    return Object.keys(this.container);
  }
}
