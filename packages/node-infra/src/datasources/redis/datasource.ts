import { BaseDataSource } from '@/base/datasources';
import { inject } from '@loopback/core';
import { Options } from '@loopback/repository';
import { RedisConnector } from './connector';
import { IRedisConnector, IRedisOptions } from './types';

const options: IRedisOptions = {
  connector: 'redis',
  name: process.env.APP_ENV_REDIS_DATASOURCE_NAME ?? 'redis',
  host: process.env.APP_ENV_REDIS_DATASOURCE_HOST ?? '0.0.0.0',
  port: process.env.APP_ENV_REDIS_DATASOURCE_PORT ?? '6379',
  password: process.env.APP_ENV_REDIS_DATASOURCE_PASSWORD ?? 'password',
};

export class RedisDataSource extends BaseDataSource<IRedisOptions> {
  static dataSourceName = options.name;

  constructor(
    @inject(`datasources.config.${options.name}`, { optional: true })
    settings: IRedisOptions = options,
  ) {
    super({ settings, scope: RedisDataSource.name });

    this.connector = new RedisConnector({ settings });
    this.connector.initialize({ context: this });

    this.logger.info('Redis DataSource Settings: %j', this.settings);
  }

  getConnector() {
    return this.connector as IRedisConnector;
  }

  override execute<R extends object = any>(
    command: string,
    parameters?: Array<string | number> | string | number | object,
    extra?: Options,
  ): Promise<R> {
    return this.getConnector().execute<R>(command, parameters, extra);
  }
}
