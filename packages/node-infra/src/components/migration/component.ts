import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/base.component';
import { Binding, CoreBindings, inject } from '@loopback/core';
import { MigrationKeys } from './common';
import { Migration } from './models';
import { MigrationRepository } from './repositories';

export class MigrationComponent extends BaseComponent {
  bindings: Binding[] = [
    // Model bindings
    Binding.bind(MigrationKeys.MIGRATION_MODEL).toClass(Migration),

    // Datasource bindings
    // Binding.bind(MigrationKeys.MIGRATION_DATASOURCE).to(null),

    // Repository bindings
    Binding.bind(MigrationKeys.MIGRATION_REPOSITORY).toClass(MigrationRepository),
  ];

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: MigrationComponent.name });

    this.binding();
  }

  defineModels() {
    this.application.model(Migration);
    this.application.models.add(Migration.name);
  }

  defineRepositories() {
    this.application.repository(MigrationRepository);
  }

  binding() {
    this.logger.info('[binding] Binding migration component for application...');
    this.defineModels();
    this.defineRepositories();
  }
}
