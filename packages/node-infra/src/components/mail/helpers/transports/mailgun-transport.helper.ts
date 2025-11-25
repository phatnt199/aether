import { BaseHelper } from '@/base/base.helper';
import {
  IMailAttachment,
  IMailMessage,
  IMailSendResult,
  IMailTransport,
  TMailgunConfig,
} from '@/components/mail';
import Mailgun from 'mailgun.js';
import type { Interfaces, MailgunMessageData, MessagesSendResult } from 'mailgun.js/definitions';
import { Stream } from 'node:stream';

export class MailgunTransportHelper extends BaseHelper implements IMailTransport {
  private client: Interfaces.IMessagesClient;
  private domain: string;

  constructor(config: TMailgunConfig) {
    super({ scope: MailgunTransportHelper.name });

    this.domain = config.domain;

    const mailgun = new Mailgun(FormData);
    const client = mailgun.client(config);

    this.client = client.messages;
  }

  async send(message: IMailMessage): Promise<IMailSendResult> {
    try {
      const mailgunMessage: MailgunMessageData = {
        from: message.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        cc: message.cc,
        bcc: message.bcc,
      };

      if (message.replyTo) {
        mailgunMessage['h:Reply-To'] = message.replyTo;
      }

      if (message.headers) {
        Object.entries(message.headers).forEach(([key, value]) => {
          mailgunMessage[`h:${key}`] = value;
        });
      }

      if (message.attachments && message.attachments.length > 0) {
        mailgunMessage.attachment = message.attachments.map((att: IMailAttachment) => {
          const attachment: {
            filename?: string;
            data: string | Buffer<ArrayBufferLike> | Stream.Readable;
          } = {
            filename: att.filename,
            data: att.path ?? att.content,
          };
          return attachment;
        });
      }

      this.logger.debug('[send] Sending email with Mailgun to: %s', mailgunMessage.to);
      const result: MessagesSendResult = await this.client.create(this.domain, mailgunMessage);

      return {
        success: true,
        messageId: result.id,
        response: result,
      };
    } catch (error) {
      this.logger.error('[send] Mailgun send failed: %s', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      this.logger.info('[verify] Verifying Mailgun API connection');
      // Mailgun doesn't have a dedicated verify endpoint
      // We'll make a lightweight API call to check if credentials work
      await this.client.create(this.domain, {
        from: 'verify@' + this.domain,
        to: ['verify@' + this.domain],
        subject: 'Verification Test',
        text: 'This is a verification test',
        'o:testmode': 'yes', // Use test mode to avoid actually sending
      });

      this.logger.info('[verify] Mailgun API connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('[verify] Mailgun API verification failed: %s', error);
      return false;
    }
  }
}
