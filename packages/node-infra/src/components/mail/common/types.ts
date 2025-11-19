import type { AnyType } from '@/common';
import { ValueOrPromise } from '@loopback/core';
import { Readable } from 'node:stream';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { MailgunClientOptions } from 'mailgun.js/definitions';

export enum EMailProvider {
  NODEMAILER = 'nodemailer',
  MAILGUN = 'mailgun',
  CUSTOM = 'custom',
}

export interface IBaseMailOptions {
  from?: string;
  fromName?: string;
}

export interface INodemailerMailOptions extends IBaseMailOptions {
  provider: EMailProvider.NODEMAILER;
  config: TNodemailerConfig;
}

export interface IMailgunMailOptions extends IBaseMailOptions {
  provider: EMailProvider.MAILGUN;
  config: TMailgunConfig;
}

export interface ICustomMailOptions extends IBaseMailOptions {
  provider: EMailProvider.CUSTOM;
  config: IMailTransport;
}

export interface IGenericMailOptions extends IBaseMailOptions {
  provider: string;
  config: Record<string, AnyType>;
}

export type TMailOptions =
  | INodemailerMailOptions
  | IMailgunMailOptions
  | ICustomMailOptions
  | IGenericMailOptions;

export type TNodemailerConfig = SMTPTransport | SMTPTransport.Options | string;

export type TMailgunConfig = MailgunClientOptions & { domain: string };

export interface IMailAttachment {
  filename?: string;
  contentType?: string;
  path?: string;
  content?: string | Buffer | Readable;
  cid?: string;
  [key: string]: any;
}

export interface IMailMessage {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: IMailAttachment[];
  headers?: Record<string, string>;
  [key: string]: any;
}

export interface IMailSendResult {
  success: boolean;
  messageId?: string;
  response?: any;
  error?: string;
}

export interface IMailTransport {
  send(message: IMailMessage): Promise<IMailSendResult>;
  verify(): Promise<boolean>;
  close?(): Promise<void>;
}

export interface IMailService {
  send(message: IMailMessage): Promise<IMailSendResult>;
  sendBatch(messages: IMailMessage[]): Promise<IMailSendResult[]>;
  sendTemplate(
    templateName: string,
    data: Record<string, any>,
    recipients: string | string[],
    options?: Partial<IMailMessage>,
  ): Promise<IMailSendResult>;
  verify(): Promise<boolean>;
}

export interface IMailTemplateEngine {
  render(templateName: string, data: Record<string, any>): ValueOrPromise<string>;
  registerTemplate(name: string, content: string): void;
}

export function isMailTransport(value: AnyType): value is IMailTransport {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const transport = value as Record<string, unknown>;

  if (typeof transport.send !== 'function') {
    return false;
  }

  if (typeof transport.verify !== 'function') {
    return false;
  }

  if (transport.close !== undefined && typeof transport.close !== 'function') {
    return false;
  }

  return true;
}

export function isValidMailOptions(options: AnyType): options is TMailOptions {
  if (!options || typeof options !== 'object') {
    return false;
  }

  const opts = options as Record<string, unknown>;

  if (typeof opts.provider !== 'string') {
    return false;
  }

  if (!opts.config) {
    return false;
  }

  return true;
}
