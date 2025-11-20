export class MailDefaults {
  static readonly BATCH_CONCURRENCY = 5;
}

export class MailErrorCodes {
  static readonly INVALID_CONFIGURATION = 'MAIL_INVALID_CONFIGURATION';
  static readonly SEND_FAILED = 'MAIL_SEND_FAILED';
  static readonly VERIFICATION_FAILED = 'MAIL_VERIFICATION_FAILED';
  static readonly INVALID_RECIPIENT = 'MAIL_INVALID_RECIPIENT';
  static readonly BATCH_SEND_FAILED = 'MAIL_BATCH_SEND_FAILED';
  static readonly TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND';
}

export class TemplateTypes {
  static readonly SIMPLE = 'simple';
  static readonly HTML = 'html';
  static readonly FUNCTION = 'function';

  static readonly SCHEME_SET = new Set([this.SIMPLE, this.HTML, this.FUNCTION]);
  static isValid(type: string): boolean {
    return this.SCHEME_SET.has(type);
  }
}

export class DefaultTemplateNames {
  static readonly WELCOME = 'welcome';
  static readonly PASSWORD_RESET = 'password-reset';
  static readonly VERIFY_EMAIL = 'verify-email';
}
