import { BindingKey } from '@loopback/core';
import { TGetMailTransportFn } from '../providers';
import {
  IMailService,
  IMailTemplateEngine,
  IVerificationCodeGenerator,
  IVerificationDataGenerator,
  IVerificationTokenGenerator,
  TMailOptions,
} from './types';

export class MailKeys {
  static readonly MAIL_OPTIONS = BindingKey.create<TMailOptions>('@app/components/mail/options');
  static readonly MAIL_SERVICE = BindingKey.create<IMailService>('@app/components/mail/service');
  static readonly MAIL_TRANSPORT_PROVIDER = BindingKey.create<TGetMailTransportFn>(
    '@app/components/mail/transport-provider',
  );
  static readonly MAIL_TEMPLATE_ENGINE = BindingKey.create<IMailTemplateEngine>(
    '@app/mail/template-engine',
  );

  static readonly MAIL_VERIFICATION_CODE_GENERATOR = BindingKey.create<IVerificationCodeGenerator>(
    '@app/mail/verification/code-generator',
  );
  static readonly MAIL_VERIFICATION_TOKEN_GENERATOR =
    BindingKey.create<IVerificationTokenGenerator>('@app/mail/verification/token-generator');
  static readonly MAIL_VERIFICATION_DATA_GENERATOR = BindingKey.create<IVerificationDataGenerator>(
    '@app/mail/verification/data-generator',
  );
}
