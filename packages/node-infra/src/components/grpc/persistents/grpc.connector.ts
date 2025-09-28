import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { ChannelCredentials } from '@grpc/grpc-js';
import { Constructor } from '@loopback/core';
import { Connector } from '@loopback/repository';
import { TGrpcServiceClient } from '../common';
import { GrpcClient, initializeGrpcClient } from '../helpers';

export interface IGrpcConnectorOptions<S extends TGrpcServiceClient> {
  host: string;
  port: string | number;
  credentials: ChannelCredentials;

  serviceClassResolver: () => Constructor<S>;
}

export class GrpcConnector<S extends TGrpcServiceClient> implements Connector {
  name: string;
  host: string;
  port: string | number;
  credentials: ChannelCredentials;
  serviceClassResolver: () => Constructor<S>;

  protected logger: ApplicationLogger;

  grpcClient: GrpcClient<S>;

  constructor(opts: IGrpcConnectorOptions<S>) {
    this.logger = LoggerFactory.getLogger([GrpcConnector.name]);

    const { host, port, credentials, serviceClassResolver } = opts;
    this.host = host;
    this.port = port;
    this.credentials = credentials;
    this.serviceClassResolver = serviceClassResolver;

    this.binding();
  }

  binding() {
    this.grpcClient = initializeGrpcClient({
      serviceClass: this.serviceClassResolver(),
      address: `${this.host}:${this.port}`,
      credentials: this.credentials,
    });
  }

  connect(): Promise<void> {
    return Promise.resolve(this.grpcClient.connect());
  }

  disconnect(): Promise<void> {
    return Promise.resolve(this.grpcClient.disconnect());
  }

  ping(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  execute<R>(method: string, parameters: any[]): Promise<R> {
    const client = this.grpcClient.client as S & { [method: string]: Function };
    return client[method]?.(...parameters);
  }
}
