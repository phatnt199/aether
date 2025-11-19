import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/base.component';
import { getError } from '@/utilities';
import { BindingScope, Component, CoreBindings, inject } from '@loopback/core';
import { MailKeys } from './common';
import { MailTransportProvider } from './providers';
import { MailService } from './services';

export class MailComponent extends BaseComponent implements Component {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: MailComponent.name });
    this.binding();
  }

  binding(): void {
    if (!this.application.isBound(MailKeys.MAIL_OPTIONS)) {
      this.logger.error(
        '[binding] Mail options not configured. Please bind MailKeys.MAIL_OPTIONS before adding MailComponent.',
      );

      throw getError({
        message: 'Mail options not configured',
      });
    }

    const mailOptions = this.application.getSync(MailKeys.MAIL_OPTIONS);
    this.logger.info('[binding] Mail Options: %j', mailOptions);

    this.application
      .bind(MailKeys.MAIL_TRANSPORT_PROVIDER)
      .toProvider(MailTransportProvider)
      .inScope(BindingScope.SINGLETON);

    this.application
      .bind(MailKeys.MAIL_SERVICE)
      .toClass(MailService)
      .inScope(BindingScope.SINGLETON);

    this.logger.info('[binding] Mail component initialized successfully');
  }
}
