import { BaseService } from '@/base/services';
import { AnyType, TConstValue } from '@/common';
import { getError } from '@/utilities';
import { BindingScope, injectable } from '@loopback/core';
import {
  DefaultTemplateNames,
  IMailTemplateEngine,
  MailErrorCodes,
  TemplateTypes,
} from '../common';
import {
  WELCOME_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
  VERIFY_EMAIL_TEMPLATE,
} from '../common/templates';

export interface ITemplate {
  name: string;
  type: TConstValue<typeof TemplateTypes>;
  content?: string;
  render?: (data: Record<string, AnyType>) => string;
  subject?: string;
  description?: string;
}

@injectable({ scope: BindingScope.SINGLETON })
export class TemplateEngineService extends BaseService implements IMailTemplateEngine {
  private templates: Map<string, ITemplate> = new Map();

  constructor() {
    super({ scope: TemplateEngineService.name });
    this.logger.info('[constructor] Template engine initialized');
    this.registerBuiltInTemplates();
  }

  registerTemplate(opts: { name: string; content: string; options?: Partial<ITemplate> }): void {
    const { name, content, options } = opts;
    this.logger.info('[registerTemplate] Registering template: %s', name);

    if (options?.type && !TemplateTypes.isValid(options.type)) {
      throw getError({ message: `Invalid template type: ${options.type}` });
    }

    const template: ITemplate = {
      name,
      type: options?.type ?? TemplateTypes.SIMPLE,
      content,
      subject: options?.subject,
      description: options?.description,
    };

    this.templates.set(name, template);
  }

  registerFunctionTemplate(
    name: string,
    renderFn: (data: Record<string, AnyType>) => string,
    options?: { subject?: string; description?: string },
  ): void {
    this.logger.info('[registerFunctionTemplate] Registering function template: %s', name);

    const template: ITemplate = {
      name,
      type: TemplateTypes.FUNCTION,
      render: renderFn,
      subject: options?.subject,
      description: options?.description,
    };

    this.templates.set(name, template);
  }

  render(opts: { templateName: string; data: Record<string, AnyType> }): string {
    const { templateName, data } = opts;
    const template = this.templates.get(templateName);

    if (!template) {
      throw getError({
        statusCode: 404,
        messageCode: MailErrorCodes.TEMPLATE_NOT_FOUND,
        message: `Template not found: ${templateName}`,
      });
    }

    this.logger.debug('[render] Rendering template: %s', templateName);

    switch (template.type) {
      case TemplateTypes.FUNCTION: {
        if (!template.render) {
          throw getError({
            statusCode: 500,
            messageCode: MailErrorCodes.INVALID_CONFIGURATION,
            message: `Function template ${templateName} has no render function`,
          });
        }
        return template.render(data);
      }

      case TemplateTypes.SIMPLE:
      case TemplateTypes.HTML: {
        return this.renderSimpleTemplate(template.content, data);
      }

      default: {
        throw getError({
          statusCode: 500,
          messageCode: MailErrorCodes.INVALID_CONFIGURATION,
          message: `Unsupported template type: ${template.type}`,
        });
      }
    }
  }

  getTemplate(name: string): ITemplate | undefined {
    return this.templates.get(name);
  }

  listTemplates(): ITemplate[] {
    return Array.from(this.templates.values());
  }

  hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  removeTemplate(name: string): boolean {
    this.logger.info('[removeTemplate] Removing template: %s', name);
    return this.templates.delete(name);
  }

  clearTemplates(): void {
    this.logger.info('[clearTemplates] Clearing all templates');
    this.templates.clear();
  }

  private renderSimpleTemplate(template: string, data: Record<string, AnyType>): string {
    return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const value = this.getNestedValue(data, trimmedKey);

      if (value === undefined || value === null) {
        this.logger.warn('[renderSimpleTemplate] Missing value for key: %s', trimmedKey);
        return match;
      }

      return String(value);
    });
  }

  private getNestedValue(obj: AnyType, path: string) {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  private registerBuiltInTemplates(): void {
    this.registerTemplate({
      name: DefaultTemplateNames.WELCOME,
      content: WELCOME_TEMPLATE,
      options: {
        type: TemplateTypes.HTML,
        subject: 'Welcome to {{appName}}!',
        description: 'Welcome email with email verification link',
      },
    });

    this.registerTemplate({
      name: DefaultTemplateNames.PASSWORD_RESET,
      content: PASSWORD_RESET_TEMPLATE,
      options: {
        type: TemplateTypes.HTML,
        subject: 'Reset Your Password',
        description: 'Password reset email with secure reset link',
      },
    });

    this.registerTemplate({
      name: DefaultTemplateNames.VERIFY_EMAIL,
      content: VERIFY_EMAIL_TEMPLATE,
      options: {
        type: TemplateTypes.HTML,
        subject: 'Verify Your Email Address',
        description: 'Email verification with code and link',
      },
    });

    this.logger.info(
      '[registerBuiltInTemplates] Registered %d built-in templates',
      this.templates.size,
    );
  }
}
