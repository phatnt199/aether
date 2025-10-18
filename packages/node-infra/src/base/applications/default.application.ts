import { BindingKeys, EnvironmentKeys, IEnvironmentValidationResult } from '@/common';
import { MigrationComponent } from '@/components';
import { MigrationKeys } from '@/components/migration/common';
import { PostgresDataSource } from '@/datasources';
import { applicationEnvironment } from '@/helpers';
import { ContentRangeInterceptor } from '@/interceptors/content-range.interceptor';
import { toBoolean } from '@/utilities';
import { ApplicationConfig, Constructor } from '@loopback/core';
import { RestBindings, SequenceHandler } from '@loopback/rest';
import isEmpty from 'lodash/isEmpty';
import { BaseApplication } from './base.application';

export abstract class DefaultRestApplication extends BaseApplication {
  protected applicationRoles: string[] = [];

  constructor(opts: { serverOptions: ApplicationConfig; sequence?: Constructor<SequenceHandler> }) {
    super(opts);
  }

  getApplicationRoles() {
    const roleConf = applicationEnvironment.get<string>(EnvironmentKeys.APP_ENV_APPLICATION_ROLES);
    return roleConf?.split(',')?.map((el: string) => el.trim());
  }

  validateEnv(): IEnvironmentValidationResult {
    const rs = { result: true, message: '' };
    const envKeys = applicationEnvironment.keys();

    for (const argKey of envKeys) {
      const argValue = applicationEnvironment.get<string | number>(argKey);

      if (toBoolean(process.env.ALLOW_EMPTY_ENV_VALUE) || !isEmpty(argValue)) {
        continue;
      }

      rs.result = false;
      rs.message = `Invalid Application Environment! Key: ${argKey} | Value: ${argValue}`;
    }

    return rs;
  }

  declareModels(): Set<string> {
    return this.models;
  }

  configureMigration() {
    this.bind(MigrationKeys.MIGRATION_DATASOURCE).toInjectable(PostgresDataSource);
    this.component(MigrationComponent);
  }

  preConfigure(): void {
    this.bind(BindingKeys.APPLICATION_ENVIRONMENTS).to(applicationEnvironment);
    this.applicationRoles = this.getApplicationRoles();
    this.logger.info('[preConfigure] ApplicationRoles: %s', this.applicationRoles);

    // Error Handler
    this.bind(RestBindings.ERROR_WRITER_OPTIONS).to({
      safeFields: ['statusCode', 'name', 'message', 'messageCode'],
    });

    // Configuring datasources
    this.dataSource(PostgresDataSource);
    // this.dataSource(KvMemDataSource);

    // Migration
    this.configureMigration();

    // Interceptors
    this.interceptor(ContentRangeInterceptor, { global: true });

    // controllers
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
      repositories: {
        dirs: ['repositories'],
        extensions: ['.repository.js'],
        nested: true,
      },
    };
  }
}
