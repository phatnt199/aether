import { GrpcConnector, IGrpcConnectorOptions } from './grpc.connector';
import { Connector, juggler, Options } from '@loopback/repository';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { ValueOrPromise } from '@loopback/core';
import { TGrpcServiceClient } from '../common';

// ------------------------------------------------------------------------------------
export abstract class BaseGrpcDataSource<S extends TGrpcServiceClient> extends juggler.DataSource {
  protected logger: ApplicationLogger;
  declare connector: GrpcConnector<S>;

  constructor(opts: { connector: Connector; settings?: Options; scope: string }) {
    super(opts.connector, opts.settings);
    this.logger = LoggerFactory.getLogger([opts.scope]);
  }

  abstract init(): ValueOrPromise<void>;
}

// ------------------------------------------------------------------------------------
export class GrpcDataSource<S extends TGrpcServiceClient> extends BaseGrpcDataSource<S> {
  constructor(opts: { dsConfig: IGrpcConnectorOptions<S> }) {
    const { dsConfig } = opts;

    const connector = new GrpcConnector<S>({ ...dsConfig });
    super({ connector, scope: GrpcDataSource.name });

    this.connector = connector;
    this.init();

    this.logger.info('[Datasource] GRPC Datasource opts: %j', opts);
  }

  init(): ValueOrPromise<void> {
    this.connecting = true;
    this.connector
      .connect()
      .then(() => {
        this.connected = true;
        this.initialized = true;
      })
      .catch(error => {
        this.initialized = false;
        this.logger.error('[init] Failed to init datasource | Error: %s', error);
      })
      .finally(() => {
        this.connecting = false;
      });
  }
}
