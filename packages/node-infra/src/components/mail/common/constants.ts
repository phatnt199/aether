export class MailDefaults {
  static readonly BATCH_CONCURRENCY = 5;
}

export class MailErrorCodes {
  static readonly INVALID_CONFIGURATION = 'MAIL_INVALID_CONFIGURATION';
  static readonly SEND_FAILED = 'MAIL_SEND_FAILED';
  static readonly VERIFICATION_FAILED = 'MAIL_VERIFICATION_FAILED';
  static readonly INVALID_RECIPIENT = 'MAIL_INVALID_RECIPIENT';
  static readonly BATCH_SEND_FAILED = 'MAIL_BATCH_SEND_FAILED';
}
