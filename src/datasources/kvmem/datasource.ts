import { BaseDataSource, IDataSourceOptions } from '@/base/datasources';
import { ValueOrPromise } from '@/common';
import { inject } from '@loopback/core';

const kvmemOptions: IDataSourceOptions = {
  name: 'kvmem',
  connector: 'kv-memory',
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
    const { connector = '', name } = this.settings as IDataSourceOptions;

    const protocol = connector.toLowerCase();
    return `${protocol}://${name}`;
  }
}
