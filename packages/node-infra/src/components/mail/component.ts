import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/base.component';
import { getError } from '@/utilities';
import { BindingScope, CoreBindings, inject } from '@loopback/core';
import { MailKeys } from './common';
import { MailQueueExecutorProvider, MailTransportProvider } from './providers';
import {
  DefaultVerificationDataGenerator,
  MailService,
  NumericCodeGenerator,
  RandomTokenGenerator,
  TemplateEngineService,
} from './services';

export class MailComponent extends BaseComponent {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: MailComponent.name });
    this.init();
  }

  private initGenerators() {
    this.application.bind(MailKeys.MAIL_VERIFICATION_CODE_GENERATOR).toClass(NumericCodeGenerator);
    this.application.bind(MailKeys.MAIL_VERIFICATION_TOKEN_GENERATOR).toClass(RandomTokenGenerator);
    this.application
      .bind(MailKeys.MAIL_VERIFICATION_DATA_GENERATOR)
      .toClass(DefaultVerificationDataGenerator);
  }

  private initProviders() {
    this.application
      .bind(MailKeys.MAIL_TRANSPORT_PROVIDER)
      .toProvider(MailTransportProvider)
      .inScope(BindingScope.SINGLETON);
    this.application
      .bind(MailKeys.MAIL_QUEUE_EXECUTOR_PROVIDER)
      .toProvider(MailQueueExecutorProvider)
      .inScope(BindingScope.SINGLETON);
  }

  private initServices() {
    this.application
      .bind(MailKeys.MAIL_SERVICE)
      .toClass(MailService)
      .inScope(BindingScope.SINGLETON);
    this.application
      .bind(MailKeys.MAIL_TEMPLATE_ENGINE)
      .toClass(TemplateEngineService)
      .inScope(BindingScope.SINGLETON);
  }

  private createAndBindInstances() {
    // Transport
    const transportGetter = this.application.getSync(MailKeys.MAIL_TRANSPORT_PROVIDER);
    const mailOptions = this.application.getSync(MailKeys.MAIL_OPTIONS);

    this.logger.info('[createAndBindInstances] Mail Options: %j', mailOptions);
    const mailTransportInstance = transportGetter(mailOptions);
    this.application.bind(MailKeys.MAIL_TRANSPORT_INSTANCE).to(mailTransportInstance);

    // Queue
    const queueGetter = this.application.getSync(MailKeys.MAIL_QUEUE_EXECUTOR_PROVIDER);
    const queueConf = this.application.getSync(MailKeys.MAIL_QUEUE_EXECUTOR_CONFIG);

    this.logger.info('[createAndBindInstances] Mail Queue Executor Config: %j', queueConf);
    const queueExecutorInstance = queueGetter(queueConf);
    this.application.bind(MailKeys.MAIL_QUEUE_EXECUTOR_INSTANCE).to(queueExecutorInstance);
  }

  init(): void {
    if (!this.application.isBound(MailKeys.MAIL_OPTIONS)) {
      this.logger.error(
        '[binding] Mail options not configured. Please bind MailKeys.MAIL_OPTIONS before adding MailComponent.',
      );

      throw getError({
        message: 'Mail options not configured',
      });
    }

    this.initGenerators();
    this.initProviders();
    this.initServices();

    this.createAndBindInstances();

    this.logger.info('[binding] Mail component initialized successfully');
  }
}
