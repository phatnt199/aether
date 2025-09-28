import { RedisHelper } from '@/helpers';
import { getError, int } from '@/utilities';
import { Class, Entity, EntityData, Filter, Model, Options } from '@loopback/repository';
import EventEmitter from 'node:events';
import { IRedisConnector, IRedisOptions } from './types';

export class RedisConnector implements IRedisConnector {
  name: string;

  redisHelper: RedisHelper;
  settings: IRedisOptions;

  configModel?: Model | undefined;
  interfaces?: string[] | undefined;

  constructor(opts: { settings: IRedisOptions }) {
    this.settings = opts.settings;
  }

  initialize<
    C extends EventEmitter & {
      initialized: boolean;
      connected: boolean;
      connecting: boolean;
      ready: boolean;
    },
  >(opts: { context: C }) {
    this.redisHelper = new RedisHelper({
      ...this.settings,
      port: int(this.settings.port),
      onInitialized: () => {
        opts.context.initialized = true;
        opts.context.emit('initialized');
      },
      onConnected: () => {
        opts.context.connected = true;
        opts.context.emit('connected');
      },
      onReady: () => {
        opts.context.ready = true;
        opts.context.emit('ready');
      },
      onError: ({ error }) => {
        opts.context.emit('error', error);
      },
    });
  }

  delete(_modelClass: Class<Entity>, key: string, _options?: Options): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.redisHelper.client
        .del(key)
        .then(() => resolve(true))
        .catch(reject);
    });
  }

  deleteAll(_modelClass: Class<Entity>, _options?: Options): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.redisHelper.client
        .dbsize()
        .then(size => {
          this.redisHelper.client
            .flushdb()
            .then(() => resolve(size))
            .catch(reject);
        })
        .catch(reject);
    });
  }

  get<T = any>(_modelClass: Class<Entity>, key: string, options?: Options): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const transform = (rs: string) => {
        return rs;
      };

      this.redisHelper
        .get({
          key,
          transform: options?.transform ?? transform,
        })
        .then(rs => resolve(rs))
        .catch(reject);
    });
  }

  set(
    _modelClass: Class<Entity>,
    key: string,
    value: EntityData,
    options?: Options & { log: boolean },
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.redisHelper
        .set({ key, value, options })
        .then(() => resolve(true))
        .catch(reject);
    });
  }

  expire(
    _modelClass: Class<Entity>,
    _key: string,
    _ttl: number,
    _options?: Options,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  ttl(_modelClass: Class<Entity>, key: string, _ttl: number, _options?: Options): Promise<number> {
    return new Promise((resolve, reject) => {
      this.redisHelper.client
        .ttl(key)
        .then(rs => resolve(rs))
        .catch(reject);
    });
  }

  keys(_modelClass: Class<Entity>, _options?: Options): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.redisHelper.client
        .keys('*')
        .then(rs => resolve(rs))
        .catch(reject);
    });
  }

  iterateKeys?(
    _modelClass: Class<Entity>,
    _filter?: Filter,
    _options?: Options,
  ): Promise<Iterator<any, any, any>> {
    throw new Error('Method not implemented.');
  }

  connect(): Promise<void> {
    return new Promise<void>(resolve => {
      this.redisHelper.connect().then(() => {
        resolve();
      });
    });
  }

  disconnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.redisHelper
        .disconnect()
        .then(() => {
          resolve();
        })
        .catch(reject);
    });
  }

  ping(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.redisHelper.client
        .ping()
        .then(() => {
          resolve();
        })
        .catch(reject);
    });
  }

  execute<R extends object = any>(
    command: string,
    parameters?: Array<string | number> | string | number | object,
    options?: Options,
  ): Promise<R>;

  execute<R extends object = any>(...args: any[]) {
    if (!args.length || args.length > 3) {
      throw getError({
        message:
          '[execute] Invalid method signature | args: [0] command name [1] array of parameters [2] extra options',
      });
    }

    const [command, parameters] = args;
    return this.redisHelper.execute<R>(command.toLowerCase(), parameters);
  }
}
