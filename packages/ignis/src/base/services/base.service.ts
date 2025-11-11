import { BaseHelper } from '../base.helper';
import { IService } from './types';

/**
 * Base service class
 * All services should extend this
 */
export abstract class BaseService extends BaseHelper implements IService {
  constructor(opts: { scope: string }) {
    super({ scope: opts.scope });
  }
}
