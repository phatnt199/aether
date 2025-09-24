import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { Connector, JugglerDataSource } from '@loopback/repository';
import { IDataSourceOptions } from './types';
import { ValueOrPromise } from '@/common';

export abstract class BaseDataSource<
  S extends IDataSourceOptions = IDataSourceOptions,
  C extends Connector = Connector,
> extends JugglerDataSource {
  protected logger: ApplicationLogger;

  constructor(opts: { scope: string; settings: S; connector?: C }) {
    const { scope, settings, connector } = opts;

    if (!connector) {
      super(settings);
    } else {
      super(connector, settings);
    }

    this.logger = LoggerFactory.getLogger([scope]);
  }

  abstract getConnectionString(): ValueOrPromise<string>;
}
