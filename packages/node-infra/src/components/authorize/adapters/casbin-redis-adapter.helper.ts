import { BaseDataSource } from '@/base/datasources';
import { Model } from 'casbin';

import { AbstractCasbinAdapter } from './base.adapter';

// -----------------------------------------------------------------------------------------
export class CasbinRedisAdapter extends AbstractCasbinAdapter {
  constructor(datasource: BaseDataSource) {
    super({ scope: CasbinRedisAdapter.name, datasource });
  }

  loadFilteredPolicy(_model: Model, _filter: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
