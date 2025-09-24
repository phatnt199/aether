import { BindingKeys, EnvironmentKeys } from '@/common';
import {
  ClassType,
  IApplication,
  IEnvironmentValidationResult,
  IRepository,
  IService,
} from '@/common/types';
import { GrpcTags } from '@/components';
import { AuthenticateKeys } from '@/components/authenticate/common';
import { applicationEnvironment, ApplicationLogger, LoggerFactory } from '@/helpers';
import { RequestBodyParserMiddleware, RequestSpyMiddleware } from '@/middlewares';
import { getError, int } from '@/utilities';
import { BootMixin } from '@loopback/boot';
import {
  ApplicationConfig,
  Binding,
  BindingFromClassOptions,
  BindingScope,
  Constructor,
  ControllerClass,
} from '@loopback/core';
import { Repository, RepositoryMixin, RepositoryTags } from '@loopback/repository';
import { MiddlewareSequence, RestApplication, SequenceHandler } from '@loopback/rest';
import { CrudRestComponent } from '@loopback/rest-crud';
import { ServiceMixin } from '@loopback/service-proxy';

import { BaseDataSource } from '../datasources';
import { BaseEntity } from '../base.model';
import { BaseApplicationSequence } from '../base.sequence';

import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

const {
  NODE_ENV,
  RUN_MODE,
  ALLOW_EMPTY_ENV_VALUE = false,
  APPLICATION_ENV_PREFIX = 'APP_ENV',

  APP_ENV_APPLICATION_NAME = 'PNT',
  APP_ENV_APPLICATION_TIMEZONE = 'Asia/Ho_Chi_Minh',
  APP_ENV_DS_MIGRATION = 'postgres',
  APP_ENV_DS_AUTHORIZE = 'postgres',
  APP_ENV_LOGGER_FOLDER_PATH = './',
} = process.env;

export abstract class BaseApplication
  extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication)))
  implements IApplication
{
  protected logger: ApplicationLogger;
  models: Set<string>;

  constructor(opts: {
    scope?: string;
    sequence?: Constructor<SequenceHandler>;
    serverOptions: ApplicationConfig;
  }) {
    const { scope = 'Application', serverOptions, sequence } = opts;
    super(serverOptions);
    this.logger = LoggerFactory.getLogger([scope]);

    this.bind(AuthenticateKeys.ALWAYS_ALLOW_PATHS).to([]);
    this.bind(BindingKeys.APPLICATION_MIDDLEWARE_OPTIONS).to(MiddlewareSequence.defaultOptions);
    this.sequence(sequence ?? BaseApplicationSequence);

    this.staticConfigure();
    this.projectRoot = this.getProjectRoot();
    this.component(CrudRestComponent);

    this.logger.info(
      '[initialize] ------------------------------------------------------------------------',
    );
    this.logger.info(
      '[initialize] Starting application... | Name: %s | Env: %s',
      APP_ENV_APPLICATION_NAME,
      NODE_ENV,
    );
    this.logger.info(
      '[initialize] AllowEmptyEnv: %s | Prefix: %s',
      ALLOW_EMPTY_ENV_VALUE,
      APPLICATION_ENV_PREFIX,
    );
    this.logger.info('[initialize] RunMode: %s', RUN_MODE);
    this.logger.info('[initialize] Timezone: %s', APP_ENV_APPLICATION_TIMEZONE);
    this.logger.info('[initialize] LogPath: %s', APP_ENV_LOGGER_FOLDER_PATH);
    this.logger.info(
      '[initialize] Datasource | Migration: %s | Authorize: %s',
      APP_ENV_DS_MIGRATION,
      APP_ENV_DS_AUTHORIZE,
    );
    this.logger.info(
      '[initialize] ------------------------------------------------------------------------',
    );

    this.logger.info('[initialize] Validating application environments...');
    const envValidation = this.validateEnv();
    if (!envValidation.result) {
      throw getError({ message: envValidation?.message ?? 'Invalid application environment!' });
    }
    this.logger.info('[initialize] All application environments are valid...');

    this.logger.info('[initialize] Declare application models...');
    this.models = new Set([]);
    this.models = this.declareModels();

    this.logger.info('[initialize] Declare application middlewares...');
    this.middleware(RequestBodyParserMiddleware);
    this.middleware(RequestSpyMiddleware);

    this.logger.info('[initialize] Executing Pre-Configuration...');
    this.preConfigure();

    this.logger.info('[initialize] Executing Post-Configuration...');
    this.postConfigure();
  }

  abstract staticConfigure(): void;
  abstract getProjectRoot(): string;
  abstract validateEnv(): IEnvironmentValidationResult;
  abstract declareModels(): Set<string>;

  abstract preConfigure(): void;
  abstract postConfigure(): void;

  getServerHost() {
    return applicationEnvironment.get<string>(EnvironmentKeys.APP_ENV_SERVER_HOST);
  }

  getServerPort() {
    return int(applicationEnvironment.get<number>(EnvironmentKeys.APP_ENV_SERVER_PORT));
  }

  getServerAddress() {
    return `${this.getServerHost()}:${this.getServerPort()}`;
  }

  getRepositorySync<R extends IRepository>(c: ClassType<R>): R {
    return this.getSync<R>(`repositories.${c.name}`);
  }

  getServiceSync<S extends IService>(c: ClassType<S>): S {
    return this.getSync<S>(`services.${c.name}`);
  }

  getMigrateModels(opts: { ignoreModels?: string[]; migrateModels?: string[] }) {
    const { ignoreModels, migrateModels } = opts;

    const repoBindings = this.findByTag(RepositoryTags.REPOSITORY);
    const valids = repoBindings.filter(b => {
      const key = b.key;
      const modelName = key.slice(key.indexOf('.') + 1, key.indexOf('Repository'));

      if (ignoreModels?.includes(modelName)) {
        return false;
      }

      if (migrateModels && !migrateModels.includes(modelName)) {
        return false;
      }

      return true;
    });

    // Load models
    return Promise.all(valids.map(b => this.get<Repository<BaseEntity>>(b.key)));
  }

  classifyModelsByDs(opts: { reps: Array<Repository<BaseEntity>> }) {
    const { reps } = opts;
    const modelByDs: Record<string, Array<string>> = {};

    for (const rep of reps) {
      const dsName = get(rep, 'dataSource.name');
      if (!dsName || isEmpty(dsName)) {
        continue;
      }

      const dsKey = `datasources.${dsName}`;
      if (!modelByDs?.[dsKey]) {
        modelByDs[dsKey] = [];
      }

      const modelName = get(rep, 'entityClass.definition.name', '') as string;
      if (isEmpty(modelName)) {
        continue;
      }

      modelByDs[dsKey].push(modelName);
    }

    return modelByDs;
  }

  async migrateModels(opts: {
    existingSchema: string;
    ignoreModels?: string[];
    migrateModels?: string[];
  }) {
    const { existingSchema, ignoreModels = [], migrateModels } = opts;

    this.logger.info('[migrateModels] Loading legacy migratable models...!');
    const reps = await this.getMigrateModels({
      ignoreModels,
      migrateModels,
    });
    const classified = this.classifyModelsByDs({ reps });

    const operation = existingSchema === 'drop' ? 'automigrate' : 'autoupdate';

    const dsBindings = this.findByTag(RepositoryTags.DATASOURCE);
    for (const b of dsBindings) {
      const t = new Date().getTime();
      this.logger.info('[migrateModels] START | Migrating datasource %s', b.key);

      const ds = await this.get<BaseDataSource>(b.key);
      if (!ds) {
        this.logger.error('[migrateModels] Invalid datasource with key %s', b.key);
        continue;
      }

      const isDisableMigration = ds.settings?.disableMigration ?? false;
      if (!(operation in ds) || isDisableMigration) {
        this.logger.info('[migrateModels] Skip migrating datasource %s', b.key);
        continue;
      }

      await ds[operation](classified?.[b.key]);
      this.logger.info(
        '[migrateModels] DONE | Migrating datasource %s | Took: %d(ms)',
        b.key,
        new Date().getTime() - t,
      );
    }
  }

  grpcController<T>(
    ctor: ControllerClass<T>,
    nameOrOptions?: string | BindingFromClassOptions,
  ): Binding<T> {
    return this.controller(ctor, nameOrOptions)
      .tag(GrpcTags.CONTROLLERS)
      .inScope(BindingScope.SINGLETON);
  }
}
