import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/base.component';
import { Binding, BindingKey, CoreBindings, inject } from '@loopback/core';

import { GrpcServerKeys, IGrpcServerOptions } from '../common';
import { GrpcServer } from '../helpers';

import { ServerCredentials } from '@grpc/grpc-js';
import { join } from 'node:path';

export class GrpcServerComponent extends BaseComponent {
  bindings: Binding[] = [
    Binding.bind<IGrpcServerOptions>(GrpcServerKeys.GRPC_OPTIONS).to({
      identifier: 'grpc-server',
      protoFolder: join(__dirname),
      address: +(process.env.APP_ENV_SERVER_PORT ?? 3000) + 1,
    }),
  ];

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: GrpcServerComponent.name });

    this.binding();
  }

  defineServer() {
    const grpcOptions = this.application.getSync<IGrpcServerOptions>(GrpcServerKeys.GRPC_OPTIONS);
    this.logger.info('[defineServer] Grpc Options: %j', grpcOptions);

    const {
      identifier,
      serverOptions,
      address,
      credentials = ServerCredentials.createInsecure(),
    } = grpcOptions;

    const server = new GrpcServer({
      identifier,
      address,
      credentials,
      options: serverOptions,
      injectionGetter: <T>(key: string | BindingKey<T>) => this.application.getSync<T>(key),
    });
    server.start();

    this.application.bind<GrpcServer>(GrpcServerKeys.SERVER_INSTANCE).to(server);
  }

  binding() {
    this.logger.info('[binding] Binding grpc component for application...');
    if (process.env.RUN_MODE === 'migrate') {
      return;
    }

    this.defineServer();
  }
}
