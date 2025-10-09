import { IDataSourceOptions } from '@/base/datasources';
import { IRedisHelperProps, RedisHelper } from '@/helpers';
import { Entity, KVConnector, Options } from '@loopback/repository';

export interface IRedisOptions extends IDataSourceOptions, IRedisHelperProps {}

export interface IRedisConnector<E extends Entity = any> extends KVConnector<E> {
  redisHelper: RedisHelper;

  execute<R extends object = any>(
    command: string,
    parameters?: Array<string | number> | string | number | object,
    options?: Options,
  ): Promise<R>;

  execute<R extends object = any>(...args: any[]): Promise<R>;
}
