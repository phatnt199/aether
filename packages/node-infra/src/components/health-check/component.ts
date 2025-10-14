import { HealthBindings, HealthComponent, HealthTags } from '@loopback/health';
import { BaseApplication, BaseComponent } from '@minimaltech/node-infra';
import { CoreBindings, inject } from '@minimaltech/node-infra/lb-core';
import { DataSource, RepositoryTags } from '@minimaltech/node-infra/lb-repo';

export class HealthcheckComponent extends BaseComponent {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: HealthcheckComponent.name });
    this.binding();
  }

  binding() {
    const t = performance.now();
    this.logger.info('[binding] START | Binding application/datasource healthcheck...!');

    this.application.configure(HealthBindings.COMPONENT).to({
      healthPath: '/health',
      livePath: '/live',
      readyPath: '/ready',
      openApiSpec: true,
    });
    this.application.component(HealthComponent);

    const dsBindings = this.application.findByTag(RepositoryTags.DATASOURCE);
    for (const dsBinding of dsBindings) {
      const bindingKey = dsBinding.key;
      const datasource: DataSource = dsBinding.getValue(this.application);

      this.application
        .bind(`health.${bindingKey}`)
        .to(() => {
          return datasource.ping();
        })
        .tag(HealthTags.READY_CHECK);
    }

    this.logger.info(
      '[binding] DONE | Binding application/datasource healthcheck | Took: %sms',
      performance.now() - t,
    );
  }
}
