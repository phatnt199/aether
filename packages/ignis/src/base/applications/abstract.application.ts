import { RuntimeModules, TRuntimeModule } from '@/common/constants';
import { IApplication, ValueOrPromise } from '@/common/types';
import { applicationEnvironment } from '@/helpers/env';
import { Container } from '@/helpers/inversion';
import { getError } from '@/utilities/error.utility';
import { int, toBoolean } from '@/utilities/parse.utility';
import { Hono } from 'hono';
import isEmpty from 'lodash/isEmpty';
import path from 'node:path';
import { IApplicationConfig, TBunServerInstance, TNodeServerInstance } from './types';

// ------------------------------------------------------------------------------
export abstract class AbstractApplication extends Container implements IApplication {
  protected server:
    | {
        hono: Hono;
        runtime: typeof RuntimeModules.BUN;
        instance?: TBunServerInstance;
      }
    | {
        hono: Hono;
        runtime: typeof RuntimeModules.NODE;
        instance?: TNodeServerInstance;
      };
  protected configs: IApplicationConfig;
  protected projectRoot: string;

  protected applications: Array<AbstractApplication>;

  // ------------------------------------------------------------------------------
  constructor(opts: { scope: string; config: IApplicationConfig }) {
    const { scope, config } = opts;
    super({ scope });

    this.configs = Object.assign({}, config, {
      host: config.host || process.env.HOST || process.env.APP_ENV_SERVER_HOST || 'localhost',
      port: config.port || int(process.env.PORT) || int(process.env.APP_ENV_SERVER_PORT) || 3000,
      basePath: config.basePath || '/',
    });

    this.projectRoot = this.getProjectRoot();
    this.server = {
      hono: new Hono({
        strict: this.configs.strictPath ?? true,
      }).basePath(this.configs.basePath),
      runtime: this.detectRuntimeModule(),
    };
  }

  // ------------------------------------------------------------------------------
  abstract staticConfigure(): void;
  abstract preConfigure(): ValueOrPromise<void>;
  abstract postConfigure(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  getProjectConfigs(): IApplicationConfig {
    return this.configs;
  }

  getProjectRoot(): string {
    return process.cwd();
  }

  getServerHost() {
    return this.configs.host;
  }

  getServerPort() {
    return this.configs.port;
  }

  getServerAddress() {
    return `${this.getServerHost()}:${this.getServerPort()}`;
  }

  getServer() {
    return this.server.hono;
  }

  getServerInstance() {
    return this.server.instance;
  }

  async initialize() {
    this.staticConfigure();
    this.validateEnvs();
    await this.preConfigure();
    await this.postConfigure();
  }

  // ------------------------------------------------------------------------------
  protected detectRuntimeModule(): TRuntimeModule {
    if (typeof Bun !== 'undefined') {
      return RuntimeModules.BUN;
    }

    return RuntimeModules.NODE;
  }

  protected validateEnvs() {
    const envKeys = applicationEnvironment.keys();
    this.logger.info(
      '[initialize] Envs: %s | START Validating application environments...',
      envKeys.length,
    );

    for (const argKey of envKeys) {
      const argValue = applicationEnvironment.get<string | number>(argKey);

      if (toBoolean(process.env.ALLOW_EMPTY_ENV_VALUE) || !isEmpty(argValue)) {
        continue;
      }

      throw getError({
        message: `[validateEnvs] Invalid Application Environment! Key: ${argKey} | Value: ${argValue}`,
      });
    }

    this.logger.info(
      '[initialize] Envs: %s | DONE Validating application environments',
      envKeys.length,
    );
  }

  protected startBunModule() {
    return new Promise((resolve, reject) => {
      const port = this.getServerPort();
      const host = this.getServerHost();
      const server = this.getServer();

      Promise.resolve(Bun.serve({ port, fetch: server.fetch, hostname: host }))
        .then(rs => {
          this.server.instance = rs;

          this.logger.info('[start] Server STARTED | Address: %s', this.getServerAddress());
          this.logger.info(
            '[start] Log folder: %s',
            path.resolve(process.env.APP_ENV_LOGGER_FOLDER_PATH ?? '').toString(),
          );
          resolve(rs);
        })
        .catch(reject);
    });
  }

  protected startNodeModule() {
    return new Promise((resolve, reject) => {
      const port = this.getServerPort();
      const host = this.getServerHost();
      const server = this.getServer();

      import('@hono/node-server')
        .then(module => {
          const { serve } = module;
          const rs = serve({ fetch: server.fetch, port, hostname: host }, info => {
            this.logger.info(
              '[start] Server STARTED | Address: %s | Info: %j',
              this.getServerAddress(),
              info,
            );
            this.logger.info(
              '[start] Log folder: %s',
              path.resolve(process.env.APP_ENV_LOGGER_FOLDER_PATH ?? '').toString(),
            );
          });

          this.server.instance = rs;
          resolve(rs);
        })
        .catch(error => {
          this.logger.error('[start] Failed to import @hono/node-server | Error: %s', error);
          reject(
            getError({
              message: `[start] @hono/node-server is required for Node.js runtime. Please install '@hono/node-server'`,
            }),
          );
        });
    });
  }

  async start() {
    await this.initialize();
    switch (this.server.runtime) {
      case RuntimeModules.BUN: {
        await this.startBunModule();
        break;
      }
      case RuntimeModules.NODE: {
        await this.startNodeModule();
        break;
      }
      default: {
        throw getError({
          message: '[start] Invalid runtimeModule to start server instance!',
        });
      }
    }
  }

  stop() {
    this.logger.info('[stop] Server STOPPED');
    switch (this.server.runtime) {
      case RuntimeModules.BUN: {
        this.server.instance.stop();
        break;
      }
      case RuntimeModules.NODE: {
        this.server.instance.close();
        break;
      }
      default: {
        throw getError({
          message: '[stop] Invalid runtimeModule to stop server instance!',
        });
      }
    }
  }
}
