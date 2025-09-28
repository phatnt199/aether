import { BaseDataSource } from '@/base/datasources';
import { getError } from '@/utilities';
import { FilteredAdapter } from 'casbin';
import { CasbinAdapterTypes, TCasbinAdapter } from '../common';
import { CasbinPostgresAdapter } from './casbin-postgres-adapter.helper';
import { CasbinRedisAdapter } from './casbin-redis-adapter.helper';

export class CasbinAdapterBuilder {
  private static instance: CasbinAdapterBuilder;

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new CasbinAdapterBuilder();
    }

    return this.instance;
  }

  build(opts: { type: TCasbinAdapter; dataSource: BaseDataSource }): FilteredAdapter {
    const { type, dataSource } = opts;

    switch (type) {
      case CasbinAdapterTypes.POSTGRES: {
        return new CasbinPostgresAdapter(dataSource);
      }
      case CasbinAdapterTypes.REDIS: {
        return new CasbinRedisAdapter(dataSource);
      }
      default: {
        throw getError({
          message: `[CasbinAdapterBuilder][build] Invalid type to build casbin adapter | type: ${type}`,
        });
      }
    }
  }
}
