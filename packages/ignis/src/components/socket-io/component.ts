import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/components';
import { CoreBindings } from '@/common/bindings';
import { HTTP } from '@/common/constants';
import { ValueOrPromise } from '@/common/types';
import { Binding, inject } from '@/helpers/inversion';
import { DefaultRedisHelper } from '@/helpers/redis';
import { getError } from '@/utilities';
import { ServerOptions } from 'socket.io';
import { BindingKeys } from './common';
import { SocketIOServerHelper } from './helpers';

interface IServerOptions extends ServerOptions {
  identifier: string;
}

const DEFAULT_SERVER_OPTIONS: Partial<IServerOptions> = {
  identifier: 'SOCKET_IO_SERVER',
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
    zlibDeflateOptions: { chunkSize: 10 * 1024 },
    zlibInflateOptions: { windowBits: 12, memLevel: 8 },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 20,
  },
};

export class SocketIOComponent extends BaseComponent {
  protected serverOptions: Partial<IServerOptions>;

  constructor(
    @inject({ key: CoreBindings.APPLICATION_INSTANCE }) private application: BaseApplication,
  ) {
    super({ scope: SocketIOComponent.name });

    this.bindings = {
      [BindingKeys.SERVER_OPTIONS]: Binding.bind<Partial<ServerOptions>>({
        key: BindingKeys.SERVER_OPTIONS,
      }).toValue(DEFAULT_SERVER_OPTIONS),
      [BindingKeys.REDIS_CONNECTION]: Binding.bind<DefaultRedisHelper | null>({
        key: BindingKeys.REDIS_CONNECTION,
      }).toValue(null),
      [BindingKeys.AUTHENTICATE_HANDLER]: Binding.bind<
        SocketIOServerHelper['authenticateFn'] | null
      >({ key: BindingKeys.AUTHENTICATE_HANDLER }).toValue(null),
      [BindingKeys.CLIENT_CONNECTED_HANDLER]: Binding.bind<
        SocketIOServerHelper['onClientConnected'] | null
      >({ key: BindingKeys.CLIENT_CONNECTED_HANDLER }).toValue(null),
    };
  }

  override binding(): ValueOrPromise<void> {
    if (!this.application) {
      throw getError({
        statusCode: HTTP.ResultCodes.RS_5.InternalServerError,
        message: '[binding] Invalid application to bind AuthenticateComponent',
      });
    }
    this.logger.info('[binding] Binding authenticate for application...');

    const extraServerOptions =
      this.application.get<Partial<ServerOptions>>({
        key: BindingKeys.SERVER_OPTIONS,
        optional: true,
      }) ?? {};
    this.serverOptions = Object.assign({}, DEFAULT_SERVER_OPTIONS, extraServerOptions);
    this.logger.debug('[binding] Socket.IO Server Options: %j', this.serverOptions);

    const redisConnection = this.application.get<DefaultRedisHelper>({
      key: BindingKeys.REDIS_CONNECTION,
    });
    if (!(redisConnection instanceof DefaultRedisHelper)) {
      throw getError({
        message:
          '[SocketIOComponent][binding] Invaid instance of redisConnection | Please init connection with RedisHelper for single redis connection or RedisClusterHelper for redis cluster mode!',
      });
    }

    const authenticateFn = this.application.get<SocketIOServerHelper['authenticateFn']>({
      key: BindingKeys.AUTHENTICATE_HANDLER,
    });

    let clientConnectedFn: any = null;
    if (this.application.isBound({ key: BindingKeys.CLIENT_CONNECTED_HANDLER })) {
      clientConnectedFn = this.application.get<SocketIOServerHelper['onClientConnected']>({
        key: BindingKeys.CLIENT_CONNECTED_HANDLER,
      });
    }

    const httpServer = this.application.getServerInstance();
    if (!httpServer) {
      throw getError({
        message: '[DANGER][SocketIOComponent] Invalid http server to setup io socket server!',
      });
    }

    this.application.bind({ key: BindingKeys.SOCKET_IO_INSTANCE }).toValue(
      new SocketIOServerHelper({
        identifier: this.serverOptions.identifier,
        server: httpServer,
        serverOptions: this.serverOptions,
        redisConnection,
        authenticateFn,
        clientConnectedFn,
      }),
    );
  }
}
