import { BaseService } from './base.service';

export class BaseApiService extends BaseService {
  protected resource: string;

  constructor(opts: { scope: string; resource: string }) {
    super({ scope: opts.scope });
    this.resource = opts.resource;
  }
}
