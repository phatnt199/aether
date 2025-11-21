import { BaseController } from '@/base/controllers';
import { inject } from '@loopback/core';
import { api, get, param, post, requestBody } from '@loopback/rest';
import {
  IMailMessage,
  IMailSendResult,
  IMailService,
  IMailTemplateEngine,
  ITemplate,
  MailKeys,
} from '../common';
import { AnyType } from '@/common';

@api({ basePath: '/mails' })
export class MailController extends BaseController {
  constructor(
    @inject(MailKeys.MAIL_SERVICE)
    private mailService: IMailService,
    @inject(MailKeys.MAIL_TEMPLATE_ENGINE)
    private templateEngine: IMailTemplateEngine,
  ) {
    super({ scope: MailController.name });
  }

  @post('/send', {
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

  @post('/send-batch', {
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

  @post('/send-template', {
    responses: {
      '200': {
        description: 'Template email sent successfully',
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
      '404': {
        description: 'Template not found',
      },
    },
  })
  async sendTemplate(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['templateName', 'to', 'data'],
            properties: {
              templateName: {
                type: 'string',
                description: 'Name of the registered template to use',
              },
              to: {
                oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                description: 'Recipient email address(es)',
              },
              data: {
                type: 'object',
                description: 'Template variables/data',
                additionalProperties: true,
              },
              options: {
                type: 'object',
                description: 'Additional email options',
                properties: {
                  from: { type: 'string' },
                  cc: {
                    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                  },
                  bcc: {
                    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                  },
                  replyTo: { type: 'string' },
                  subject: {
                    type: 'string',
                    description: 'Override template subject',
                  },
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
                  requireValidate: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    })
    payload: {
      templateName: string;
      to: string | string[];
      data: Record<string, AnyType>;
      options?: Partial<IMailMessage>;
    },
  ): Promise<IMailSendResult> {
    const { templateName, to, data, options } = payload;

    return this.mailService.sendTemplate({ templateName, data, recipients: to, options });
  }

  @get('template-engine', {
    responses: {
      '200': {
        description: 'List all registered templates',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  subject: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async listTemplates(): Promise<ITemplate[]> {
    return this.templateEngine.listTemplates();
  }

  @get('template-engine/{name}', {
    responses: {
      '200': {
        description: 'Get template information',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                subject: { type: 'string' },
                description: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
        },
      },
      '404': {
        description: 'Template not found',
      },
    },
  })
  async getTemplate(
    @param.path.string('name') name: string,
  ): Promise<ITemplate | { error: string }> {
    const template = this.templateEngine.getTemplate(name);
    if (!template) {
      return { error: `Template not found: ${name}` };
    }
    return template;
  }

  @post('/verify', {
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
