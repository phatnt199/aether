export class ExposeVerbs {
  static readonly HANDLER = 'handler';
  static readonly SUBSCRIBER = 'subscriber';
  static readonly SENDER = 'sender';

  static readonly SCHEME_SET = new Set([this.HANDLER, this.SUBSCRIBER, this.SENDER]);

  static isValid(input: string) {
    return this.SCHEME_SET.has(input);
  }
}

export class CASignTypes {
  static readonly TRUSTED_CA = 'trusted-ca';
  static readonly SELF_SIGNED_CA = 'self-signed-ca';

  static readonly SCHEME_SET = new Set([this.TRUSTED_CA, this.SELF_SIGNED_CA]);

  static isValid(input: string) {
    return this.SCHEME_SET.has(input);
  }
}
