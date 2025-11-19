import { BaseApplication } from '@/base/applications';
import { BaseProvider } from '@/base/base.provider';
import { getError } from '@/utilities';
import { CoreBindings, inject, Provider, ValueOrPromise } from '@loopback/core';
import {
  EMailProvider,
  ICustomMailOptions,
  IMailgunMailOptions,
  IMailTransport,
  INodemailerMailOptions,
  isMailTransport,
  MailErrorCodes,
  MailKeys,
  TMailOptions,
} from '../common';
import { MailgunTransport } from './mailgun.transport';
import { NodemailerTransport } from './nodemailer.transport';

export type TGetMailTransportFn = () => IMailTransport;

export class MailTransportProvider
  extends BaseProvider<TGetMailTransportFn>
  implements Provider<TGetMailTransportFn>
{
  constructor(@inject(CoreBindings.APPLICATION_INSTANCE) private application: BaseApplication) {
    super({ scope: MailTransportProvider.name });
  }

  value(): ValueOrPromise<TGetMailTransportFn> {
    const options = this.application.getSync<TMailOptions>(MailKeys.MAIL_OPTIONS);
    this.logger.info('[value] Creating mail transport for provider: %s', options.provider);

    return () => {
      switch (options.provider) {
        case EMailProvider.NODEMAILER: {
          return this.createNodemailerTransport(options);
        }

        case EMailProvider.MAILGUN: {
          return this.createMailgunTransport(options);
        }

        case EMailProvider.CUSTOM: {
          return this.createCustomTransport(options);
        }

        default: {
          throw getError({
            statusCode: 500,
            messageCode: MailErrorCodes.INVALID_CONFIGURATION,
            message: `Unsupported mail provider: ${options.provider}`,
          });
        }
      }
    };
  }

  private createNodemailerTransport(options: TMailOptions): NodemailerTransport {
    if (this.isNodemailerOptions(options)) {
      this.logger.info('[createNodemailerTransport] Initializing Nodemailer transport');
      return new NodemailerTransport(options.config);
    }

    throw getError({
      statusCode: 500,
      messageCode: MailErrorCodes.INVALID_CONFIGURATION,
      message: 'Invalid Nodemailer configuration',
    });
  }

  private createMailgunTransport(options: TMailOptions): MailgunTransport {
    if (this.isMailgunOptions(options)) {
      this.logger.info('[createMailgunTransport] Initializing Mailgun transport');
      return new MailgunTransport(options.config);
    }

    throw getError({
      statusCode: 500,
      messageCode: MailErrorCodes.INVALID_CONFIGURATION,
      message: 'Invalid Mailgun configuration',
    });
  }

  private createCustomTransport(options: TMailOptions): IMailTransport {
    if (!this.isCustomOptions(options)) {
      throw getError({
        statusCode: 500,
        messageCode: MailErrorCodes.INVALID_CONFIGURATION,
        message: 'Invalid custom mail provider configuration',
      });
    }

    if (!isMailTransport(options.config)) {
      const missingMethods: string[] = [];

      if (typeof (options.config as any).send !== 'function') {
        missingMethods.push('send');
      }
      if (typeof (options.config as any).verify !== 'function') {
        missingMethods.push('verify');
      }

      throw getError({
        statusCode: 500,
        messageCode: MailErrorCodes.INVALID_CONFIGURATION,
        message: `Custom mail provider must implement IMailTransport interface. Missing methods: ${missingMethods.join(', ')}`,
      });
    }

    this.logger.info('[createCustomTransport] Using custom mail transport');
    return options.config;
  }

  private isNodemailerOptions(options: TMailOptions): options is INodemailerMailOptions {
    return options.provider === EMailProvider.NODEMAILER && 'config' in options;
  }

  private isMailgunOptions(options: TMailOptions): options is IMailgunMailOptions {
    return options.provider === EMailProvider.MAILGUN && 'config' in options;
  }

  private isCustomOptions(options: TMailOptions): options is ICustomMailOptions {
    return options.provider === EMailProvider.CUSTOM && 'config' in options;
  }
}
