import type { IService } from '@/common/types';

/**
 * Base service class
 * All services should extend this
 */
export abstract class BaseService implements IService {
  protected scope: string;

  constructor(options: { scope: string }) {
    this.scope = options.scope;
  }

  /**
   * Get service scope/name
   */
  getScope(): string {
    return this.scope;
  }
}
