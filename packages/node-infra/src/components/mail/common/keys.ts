import { BindingKey } from '@loopback/core';
import { TGetMailTransportFn } from '../providers';
import { IMailService, IMailTemplateEngine, TMailOptions } from './types';

export class MailKeys {
  static readonly MAIL_OPTIONS = BindingKey.create<TMailOptions>('@app/components/mail/options');
  static readonly MAIL_SERVICE = BindingKey.create<IMailService>('@app/components/mail/service');
  static readonly MAIL_TRANSPORT_PROVIDER = BindingKey.create<TGetMailTransportFn>(
    '@app/components/mail/transport-provider',
  );
  static readonly MAIL_TEMPLATE_ENGINE = BindingKey.create<IMailTemplateEngine>(
    '@app/mail/template-engine',
  );
}
