import {
  getExpiryTime,
  getExpiryTimeInHours,
  IVerificationCodeGenerator,
  IVerificationData,
  IVerificationDataGenerator,
  IVerificationGenerationOptions,
  IVerificationTokenGenerator,
  MailKeys,
} from '@/components/mail';
import { inject, injectable } from '@minimaltech/node-infra/lb-core';
import crypto from 'node:crypto';

@injectable()
export class NumericCodeGenerator implements IVerificationCodeGenerator {
  generateCode(length: number): string {
    const max = Math.pow(10, length);
    const code = crypto.randomInt(0, max);
    return code.toString().padStart(length, '0');
  }
}

@injectable()
export class RandomTokenGenerator implements IVerificationTokenGenerator {
  generateToken(bytes: number): string {
    return crypto.randomBytes(bytes).toString('base64url');
  }
}

@injectable()
export class DefaultVerificationDataGenerator implements IVerificationDataGenerator {
  constructor(
    @inject(MailKeys.MAIL_VERIFICATION_CODE_GENERATOR)
    private codeGenerator: IVerificationCodeGenerator,

    @inject(MailKeys.MAIL_VERIFICATION_TOKEN_GENERATOR)
    private tokenGenerator: IVerificationTokenGenerator,
  ) {}

  generateVerificationData(options: IVerificationGenerationOptions): IVerificationData {
    const code = this.codeGenerator.generateCode(options.codeLength);
    const token = this.tokenGenerator.generateToken(options.tokenBytes);
    const now = new Date().toISOString();

    return {
      verificationCode: code,
      codeGeneratedAt: now,
      codeExpiresAt: getExpiryTime(options.codeExpiryMinutes).toISOString(),
      codeAttempts: 0,

      verificationToken: token,
      tokenGeneratedAt: now,
      tokenExpiresAt: getExpiryTimeInHours(options.tokenExpiryHours).toISOString(),

      lastCodeSentAt: now,
    };
  }
}
