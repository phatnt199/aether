import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { dayjs, getError } from '@/utilities';
import * as grpc from '@grpc/grpc-js';
import { Constructor, ValueOrPromise } from '@loopback/core';
import { IGrpcClientOptions, TGrpcServiceClient } from '../common';

export class GrpcClient<S extends TGrpcServiceClient> {
  client: S;
  private logger: ApplicationLogger;

  private identifier: string;
  private serviceClass: Constructor<S>;
  private address: string | number;
  private credentials: grpc.ChannelCredentials;

  private onClientReady?: (opts: { client: S }) => ValueOrPromise<void>;

  constructor(opts: IGrpcClientOptions<S>) {
    const {
      identifier,
      serviceClass,
      address,
      credentials,
      autoConnect = false,
      onClientReady,
    } = opts;

    this.identifier = identifier;
    this.logger = LoggerFactory.getLogger([this.identifier]);

    this.serviceClass = serviceClass;
    this.address = address;
    this.credentials = credentials;
    this.onClientReady = onClientReady;

    if (autoConnect) {
      this.connect();
    }
  }

  static fromServiceClient<C extends TGrpcServiceClient>(
    opts: Omit<IGrpcClientOptions<C>, 'identifier'>,
  ) {
    return new GrpcClient<C>({ ...opts, identifier: opts.serviceClass.name });
  }

  connect() {
    if (this.client) {
      this.logger.info('[connect] GrpcClient is connected | Skip initializing new client!');
      return;
    }

    const ServiceClass = this.serviceClass;
    if (!ServiceClass) {
      throw getError({
        message: '[bindingClient] Invalid serviceClass to init grpc client',
      });
    }

    this.client = new ServiceClass(this.address, this.credentials);

    const deadline = dayjs().add(10, 'seconds').toDate();
    this.client.waitForReady(deadline, error => {
      if (error) {
        this.logger.error(
          '[bindingClient][waitForReady] Client cannot be ready | Error: %s',
          error,
        );
        return;
      }

      this.logger.info('[bindingClient][waitForReady] GRPC Client: %s | READY', this.identifier);
      this.onClientReady?.({ client: this.client });
    });
  }

  disconnect() {
    if (!this.client) {
      this.logger.info('[connect] GrpcClient is not initialized | Skip disconnecting client!');
      return;
    }

    this.client.close();
  }
}

export const initializeGrpcClient = <C extends TGrpcServiceClient>(
  opts: Omit<IGrpcClientOptions<C>, 'identifier'>,
) => {
  return GrpcClient.fromServiceClient(opts);
};
