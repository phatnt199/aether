import { BaseController } from '@/base/controllers';
import { inject } from '@loopback/core';
import { post, requestBody } from '@loopback/rest';
import { IMailMessage, IMailSendResult, IMailService, MailKeys } from '../common';

export class MailController extends BaseController {
  constructor(
    @inject(MailKeys.MAIL_SERVICE)
    private mailService: IMailService,
  ) {
    super({ scope: MailController.name });
  }

  @post('/mail/send', {
    responses: {
      '200': {
        description: 'Email sent successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                messageId: { type: 'string' },
                response: { type: 'object' },
              },
            },
          },
        },
      },
    },
  })
  async send(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['to', 'subject'],
            properties: {
              from: { type: 'string' },
              to: {
                oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
              },
              cc: {
                oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
              },
              bcc: {
                oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
              },
              replyTo: { type: 'string' },
              subject: { type: 'string' },
              text: { type: 'string' },
              html: { type: 'string' },
              attachments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    contentType: { type: 'string' },
                    path: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    })
    message: IMailMessage,
  ): Promise<IMailSendResult> {
    return this.mailService.send(message);
  }

  @post('/mail/send-batch', {
    responses: {
      '200': {
        description: 'Batch emails sent',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  messageId: { type: 'string' },
                  error: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async sendBatch(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              required: ['to', 'subject'],
              properties: {
                to: { type: 'string' },
                subject: { type: 'string' },
                text: { type: 'string' },
                html: { type: 'string' },
              },
            },
          },
        },
      },
    })
    messages: IMailMessage[],
  ): Promise<IMailSendResult[]> {
    return this.mailService.sendBatch(messages);
  }

  @post('/mail/verify', {
    responses: {
      '200': {
        description: 'Mail transport verification result',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                verified: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  async verify(): Promise<{ isVerified: boolean }> {
    const isVerified = await this.mailService.verify();
    return { isVerified };
  }
}
