import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/base.component';
import { DefaultRedisHelper } from '@/helpers';
import { getError } from '@/utilities';
import { Binding, CoreBindings, inject } from '@loopback/core';
import { ServerOptions } from 'socket.io';
import { SocketIOKeys } from './common';
import { SocketIOServerHelper } from './helpers';

export class SocketIOComponent extends BaseComponent {
  bindings: Binding[] = [
    Binding.bind(SocketIOKeys.IDENTIFIER).to('SOCKET_IO_SERVER'),
    Binding.bind<Partial<ServerOptions>>(SocketIOKeys.SERVER_OPTIONS).to({
      path: '/io',
    }),
    Binding.bind<DefaultRedisHelper | null>(SocketIOKeys.REDIS_CONNECTION).to(null),
  ];

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: SocketIOComponent.name });
    this.binding();
  }

  binding() {
    if (!this.application) {
      throw getError({
        statusCode: 500,
        message: '[binding] Invalid application to bind AuthenticateComponent',
      });
    }
    this.logger.info('[binding] Binding authenticate for application...');

    const identifier = this.application.getSync<string>(SocketIOKeys.IDENTIFIER);

    let serverOptions: Partial<ServerOptions> = {
      path: '/io',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
      },
      perMessageDeflate: {
        threshold: 4096,
        zlibDeflateOptions: {
          chunkSize: 10 * 1024,
        },
        zlibInflateOptions: {
          windowBits: 12,
          memLevel: 8,
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 20,
      },
    };

    if (this.application.isBound(SocketIOKeys.SERVER_OPTIONS)) {
      const extraServerOptions = this.application.getSync<Partial<ServerOptions>>(
        SocketIOKeys.SERVER_OPTIONS,
      );

      serverOptions = Object.assign({}, serverOptions, extraServerOptions);
    }

    const redisConnection = this.application.getSync<DefaultRedisHelper>(
      SocketIOKeys.REDIS_CONNECTION,
    );

    if (!(redisConnection instanceof DefaultRedisHelper)) {
      throw getError({
        message:
          '[SocketIOComponent][binding] Invaid instance of redisConnection | Please init connection with RedisHelper for single redis connection or RedisClusterHelper for redis cluster mode!',
      });
    }

    const authenticateFn = this.application.getSync<SocketIOServerHelper['authenticateFn']>(
      SocketIOKeys.AUTHENTICATE_HANDLER,
    );

    let clientConnectedFn: any = null;
    if (this.application.isBound(SocketIOKeys.CLIENT_CONNECTED_HANDLER)) {
      clientConnectedFn = this.application.getSync<SocketIOServerHelper['onClientConnected']>(
        SocketIOKeys.CLIENT_CONNECTED_HANDLER,
      );
    }

    const restServer = this.application.restServer;
    const httpServer = restServer.httpServer;
    if (!httpServer) {
      throw getError({
        message: '[DANGER][SocketIOComponent] Invalid http server to setup io socket server!',
      });
    }

    this.application.bind(SocketIOKeys.SOCKET_IO_INSTANCE).to(
      new SocketIOServerHelper({
        identifier: identifier ?? `SOCKET_IO_SERVER`,
        server: httpServer.server,
        serverOptions,
        redisConnection,
        authenticateFn,
        clientConnectedFn,
      }),
    );
  }
}
