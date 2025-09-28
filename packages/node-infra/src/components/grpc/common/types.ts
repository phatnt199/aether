import { Client, ServerOptions, ServerCredentials, ChannelCredentials } from '@grpc/grpc-js';
import { Constructor, ValueOrPromise } from '@loopback/core';

export interface IGrpcServerOptions {
  identifier: string;
  serverOptions?: ServerOptions;

  protoFolder: string;
  address: string | number; // host:port | port
  credentials?: ServerCredentials;
}

export interface IGrpcController {}

export interface IGrpcControllerOptions {}

export interface IGrpcMethodOptions {
  proto: string;
  // package: string;
  service: string;
  method?: string;
  isRequestStream?: boolean;
  isResponseStream?: boolean;
}

export type TGrpcServiceClient = Client;

export interface IGrpcClientOptions<S extends Client> {
  identifier: string;
  serviceClass: Constructor<S>;
  address: string | number;
  credentials: ChannelCredentials;
  autoConnect?: boolean;
  onClientReady?: (opts: { client: S }) => ValueOrPromise<void>;
}
