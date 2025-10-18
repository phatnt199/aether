import { BaseDataSource, IDataSourceOptions } from '@/base/datasources';
import { ValueOrPromise } from '@/common';
import { getError } from '@/utilities';
import { inject } from '@loopback/core';

const kvmemOptions: IDataSourceOptions = {
  name: 'memory',
  connector: 'memory',
};

export class KvMemDataSource extends BaseDataSource<IDataSourceOptions> {
  static dataSourceName = kvmemOptions.name;
  // static readonly defaultConfig = dsConfigs;

  constructor(
    @inject(`datasources.config.${kvmemOptions.name}`, { optional: true })
    settings: IDataSourceOptions = kvmemOptions,
  ) {
    super({ settings, scope: KvMemDataSource.name });
    this.logger.info('[Datasource] KvMem Datasource Config: %j', settings);
  }

  override getConnectionString(): ValueOrPromise<string> {
    throw getError({ message: '[getConnectionString] KVMem Datasource has no connection string!' });
  }
}
