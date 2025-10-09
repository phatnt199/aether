import { IRepository } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError } from '@/utilities';
import { BaseGrpcDataSource, GrpcDataSource } from './grpc.datasource';
import { TGrpcServiceClient } from '../common';

export class GrpcRepository<S extends TGrpcServiceClient> implements IRepository {
  protected logger: ApplicationLogger;
  private dataSource: GrpcDataSource<S>;

  constructor(opts: { dataSource: BaseGrpcDataSource<S>; scope: string }) {
    this.dataSource = opts.dataSource;
    this.logger = LoggerFactory.getLogger([opts.scope]);
  }

  getServiceClient() {
    if (!this.dataSource.connected) {
      const ServiceClass = this.dataSource.connector.serviceClassResolver();
      throw getError({
        message: `[getServiceClient] Service: ${ServiceClass.name} | Service client is not connected!`,
      });
    }

    if (!this.dataSource?.connector?.grpcClient?.client) {
      throw getError({
        message: `[getServiceClient] Service client is not available | Please initialize before using`,
      });
    }

    return this.dataSource.connector.grpcClient.client;
  }
}
