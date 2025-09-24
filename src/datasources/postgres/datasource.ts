import { BaseDataSource } from '@/base/datasources';
import { getError } from '@/utilities';
import { inject } from '@loopback/core';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { IPostgresOptions } from './types';

const databaseConfigs: IPostgresOptions = {
  connector: 'postgresql',
  name: process.env.APP_ENV_DATASOURCE_NAME ?? 'postgres',
  host: process.env.APP_ENV_POSTGRES_HOST ?? '0.0.0.0',
  port: process.env.APP_ENV_POSTGRES_PORT ?? '5432',
  user: process.env.APP_ENV_POSTGRES_USERNAME ?? 'postgres',
  password: process.env.APP_ENV_POSTGRES_PASSWORD ?? 'password',
  database: process.env.APP_ENV_POSTGRES_DATABASE ?? 'postgres',
};

export class PostgresDataSource extends BaseDataSource {
  static dataSourceName = databaseConfigs.name;
  static readonly defaultConfig = databaseConfigs;

  constructor(
    @inject(`datasources.config.${databaseConfigs.name}`, { optional: true })
    dsConfig = databaseConfigs,
  ) {
    for (const key in dsConfig) {
      const value = get(dsConfig, key);
      switch (typeof value) {
        case 'number': {
          if (!value || value < 0) {
            throw getError({
              message: `[DANGER] INVALID POSTGRES DATABASE CONFIGURE | Key: ${key} | Value: ${value}`,
            });
          }
          break;
        }
        case 'string': {
          if (!value || isEmpty(value)) {
            throw getError({
              message: `[DANGER] INVALID POSTGRES DATABASE CONFIGURE | Key: ${key} | Value: ${value}`,
            });
          }
          break;
        }
        default: {
          break;
        }
      }
    }

    super({ settings: dsConfig, scope: PostgresDataSource.name });
    this.logger.info('Postgres DataSource Settings: %j', dsConfig);
  }
}
