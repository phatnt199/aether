import { BindingKey } from '@loopback/core';
import { TGetMailQueueExecutorFn, TGetMailTransportFn } from '../providers';
import {
  IMailQueueExecutor,
  IMailQueueExecutorConfig,
  IMailService,
  IMailTemplateEngine,
  IMailTransport,
  IVerificationCodeGenerator,
  IVerificationDataGenerator,
  IVerificationTokenGenerator,
  TMailOptions,
} from './types';

export class MailKeys {
  // Options & Configs
  static readonly MAIL_OPTIONS = BindingKey.create<TMailOptions>('@app/components/mail/options');
  static readonly MAIL_QUEUE_EXECUTOR_CONFIG = BindingKey.create<IMailQueueExecutorConfig>(
    '@app/components/mail/queue/executor-config',
  );

  // Transporter
  static readonly MAIL_TRANSPORT_PROVIDER = BindingKey.create<TGetMailTransportFn>(
    '@app/components/mail/transport-provider',
  );
  static readonly MAIL_TRANSPORT_INSTANCE = BindingKey.create<IMailTransport>(
    '@app/components/mail/transport-instance',
  );

  // Services
  static readonly MAIL_TEMPLATE_ENGINE = BindingKey.create<IMailTemplateEngine>(
    '@app/components/mail/services/template-engine',
  );
  static readonly MAIL_SERVICE = BindingKey.create<IMailService>('@app/components/mail/service');

  // Generators
  static readonly MAIL_VERIFICATION_CODE_GENERATOR = BindingKey.create<IVerificationCodeGenerator>(
    '@app/components/mail/verification/code-generator',
  );
  static readonly MAIL_VERIFICATION_TOKEN_GENERATOR =
    BindingKey.create<IVerificationTokenGenerator>(
      '@app/components/mail/verification/token-generator',
    );
  static readonly MAIL_VERIFICATION_DATA_GENERATOR = BindingKey.create<IVerificationDataGenerator>(
    '@app/components/mail/verification/data-generator',
  );

  // Queue
  static readonly MAIL_QUEUE_EXECUTOR_PROVIDER = BindingKey.create<TGetMailQueueExecutorFn>(
    '@app/components/mail/queue-executor-provider',
  );
  static readonly MAIL_QUEUE_EXECUTOR_INSTANCE = BindingKey.create<IMailQueueExecutor>(
    '@app/components/mail/queue-executor-instance',
  );
}
